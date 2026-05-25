import axios from 'axios'
import FormData from 'form-data'
import multer from 'multer'
import sharp from 'sharp'

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function sendError(res, statusCode, message) {
  return sendJson(res, statusCode, { success: false, message })
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body)
  }

  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')
  return rawBody ? JSON.parse(rawBody) : {}
}

function isDevelopmentEnv() {
  return process.env.NODE_ENV !== 'production'
}

function buildTelegramProxyUrl(fileId) {
  if (!fileId) return ''

  const configuredBase = String(process.env.VERCEL_URL || process.env.VITE_API_BASE_URL || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  const proxyPath = `/api/image/${encodeURIComponent(fileId)}`
  return configuredBase ? `https://${configuredBase}${proxyPath}` : proxyPath
}

function resolveTelegramReference(fileRef) {
  let decoded = ''
  try {
    decoded = decodeURIComponent(String(fileRef || '').trim())
  } catch {
    decoded = String(fileRef || '').trim()
  }

  decoded = decoded.replace(/^\/+/, '')

  if (!decoded) {
    return null
  }

  if (decoded.includes('/')) {
    return { type: 'file_path', value: decoded }
  }

  return { type: 'file_id', value: decoded }
}

function getImageContentType(filePath, fallback = 'application/octet-stream') {
  const extension = String(filePath || '')
    .toLowerCase()
    .split('.')
    .pop()

  const contentTypeByExtension = {
    avif: 'image/avif',
    bmp: 'image/bmp',
    gif: 'image/gif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
  }

  return contentTypeByExtension[extension] || fallback
}

function getMimeTypeFromPath(path = '') {
  const lower = String(path || '').toLowerCase()

  if (lower.endsWith('.png')) {
    return 'image/png'
  }

  if (lower.endsWith('.webp')) {
    return 'image/webp'
  }

  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg'
  }

  return 'image/jpeg'
}

function runMiddleware(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

function createUploadMiddleware() {
  const storage = multer.memoryStorage()

  const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp'])

  return multer({
    storage,
    limits: {
      fileSize: MAX_IMAGE_SIZE_BYTES,
    },
    fileFilter: (req, file, callback) => {
      const mime = String(file.mimetype || '').toLowerCase()
      if (!allowedMimes.has(mime)) {
        callback(new Error('Only JPEG, PNG or WEBP images are allowed.'))
        return
      }

      callback(null, true)
    },
    filename: (req, file, cb) => {
      // multer memoryStorage ignores filename, but keep sanitizer here if changed to disk
      const original = String(file.originalname || 'upload')
      const sanitized = original.replace(/[^a-zA-Z0-9._-]/g, '_')
      cb(null, sanitized)
    },
  }).single('image')
}

function getTelegramErrorMessage(error, fallbackMessage) {
  if (axios.isAxiosError(error)) {
    const telegramMessage =
      error.response?.data?.description ||
      error.response?.data?.error ||
      error.response?.data?.message

    if (telegramMessage) {
      return telegramMessage
    }
  }

  return error?.message || fallbackMessage
}

function getSafeErrorDetails(error) {
  if (!error) return 'Unknown error'

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data

    if (typeof data === 'string') {
      return {
        status,
        data,
      }
    }

    if (data && typeof data === 'object' && !data.pipe) {
      return {
        status,
        data,
      }
    }

    return {
      status,
      message: error.message,
    }
  }

  if (error?.telegramResponse) {
    return {
      status: error.statusCode || 500,
      data: error.telegramResponse,
    }
  }

  return error?.message || String(error)
}

async function optimizeImage(buffer) {
  return sharp(buffer)
    .resize({
      width: 1200,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer()
}

async function uploadImageToTelegram({ buffer, telegramToken, telegramChannelId }) {
  const optimizedBuffer = await optimizeImage(buffer)
  const formData = new FormData()

  formData.append('chat_id', telegramChannelId)
  formData.append('photo', optimizedBuffer, {
    filename: `telegram-upload-${Date.now()}.webp`,
    contentType: 'image/webp',
  })

  const sendPhotoResponse = await axios.post(
    `https://api.telegram.org/bot${telegramToken}/sendPhoto`,
    formData,
    {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  )

  const fileId = sendPhotoResponse?.data?.result?.photo?.at(-1)?.file_id

  if (!fileId) {
    throw new Error('Telegram upload succeeded, but no file_id was returned.')
  }

  const fileResponse = await axios.get(
    `https://api.telegram.org/bot${telegramToken}/getFile`,
    {
      params: { file_id: fileId },
    }
  )

  const filePath = fileResponse?.data?.result?.file_path
  const messageId = sendPhotoResponse?.data?.result?.message_id || null
  const chatId = sendPhotoResponse?.data?.result?.chat?.id || telegramChannelId || null

  if (!filePath) {
    throw new Error('Telegram file path was not returned.')
  }

  return {
    file_id: fileId,
    file_path: filePath,
    telegram_message_id: messageId,
    telegram_chat_id: chatId,
    url: buildTelegramProxyUrl(fileId),
  }
}

function normalizeTelegramDeleteItems(rawItems = []) {
  if (!Array.isArray(rawItems)) {
    return []
  }

  return rawItems
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const messageId = item.telegram_message_id || item.message_id || null
      const chatId = item.telegram_chat_id || item.chat_id || null

      if (!messageId) {
        return null
      }

      return {
        message_id: messageId,
        chat_id: chatId,
      }
    })
    .filter(Boolean)
}

function isAlreadyDeletedTelegramError(error) {
  const description = String(error?.response?.data?.description || '').toLowerCase()
  return description.includes('message to delete not found') || description.includes('message can\'t be deleted')
}

async function getTelegramFileMeta({ telegramToken, fileId }) {
  const telegramResponse = await axios.get(
    `https://api.telegram.org/bot${telegramToken}/getFile`,
    {
      params: { file_id: fileId },
    }
  )

  if (!telegramResponse.data?.ok || !telegramResponse.data?.result?.file_path) {
    const error = new Error('Telegram file path not found')
    error.statusCode = 404
    error.telegramResponse = telegramResponse.data
    throw error
  }

  const filePath = telegramResponse.data.result.file_path

  // Log response status and filePath (production-safe, no token)
  try {
    console.log('getTelegramFileMeta', { status: telegramResponse.status, filePath })
  } catch (e) {}

  return {
    file_path: filePath,
    file_url: `https://api.telegram.org/file/bot${telegramToken}/${filePath}`,
    telegramResponse: telegramResponse.data,
  }
}

async function fetchTelegramFileStream({ telegramToken, decodedFileId }) {
  const reference = resolveTelegramReference(decodedFileId)

  if (!reference) {
    throw new Error('Image file ID is required.')
  }

  const filePath =
    reference.type === 'file_path'
      ? reference.value
      : (await getTelegramFileMeta({ telegramToken, fileId: reference.value })).file_path

  const telegramFileUrl = `https://api.telegram.org/file/bot${telegramToken}/${filePath}`
  if (isDevelopmentEnv()) {
    console.log('Telegram download URL resolved (redacted)')
  }

  // Request the file stream from Telegram (don't log the full URL as it contains the bot token)
  const imageResponse = await axios.get(telegramFileUrl, {
    responseType: 'stream',
  })

  try {
    console.log('fetchTelegramFileStream', { filePath, status: imageResponse.status })
  } catch (e) {}

  return {
    imageResponse,
    reference,
    filePath,
    telegramFileUrl,
  }
}

function getQueryFileId(req) {
  const raw = req?.query?.fileId
  const first = Array.isArray(raw) ? raw.join('/') : raw

  if (first) {
    try {
      return decodeURIComponent(String(first)).replace(/^\/+/, '')
    } catch {
      return String(first).replace(/^\/+/, '')
    }
  }

  const requestUrl = new URL(req.url || '/', 'http://localhost')
  const fromPath = requestUrl.pathname.replace(/^\/api\/image\//, '')
  try {
    return decodeURIComponent(fromPath).replace(/^\/+/, '')
  } catch {
    return fromPath.replace(/^\/+/, '')
  }
}

export function createTelegramImageHandler({ telegramToken, telegramChannelId }) {
  const upload = createUploadMiddleware()

  return async function telegramImageHandler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return sendJson(res, 405, { error: 'Method Not Allowed' })
    }

    if (!telegramToken || !telegramChannelId) {
      return sendJson(res, 500, {
        error: 'Telegram credentials are missing.',
      })
    }

    try {
      await runMiddleware(req, res, upload)

      if (!req.file) {
        return sendJson(res, 400, { error: 'An image file is required.' })
      }

      if (!req.file.mimetype?.startsWith('image/')) {
        return sendJson(res, 400, { error: 'Only image files are allowed.' })
      }

      const result = await uploadImageToTelegram({
        buffer: req.file.buffer,
        telegramToken,
        telegramChannelId,
      })

      return sendJson(res, 200, result)
    } catch (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return sendJson(res, 413, { error: 'Image must be 5MB or smaller.' })
        }

        return sendJson(res, 400, { error: 'Invalid image upload.' })
      }

      if (error?.message === 'Only image files are allowed.') {
        return sendJson(res, 400, { error: error.message })
      }

      return sendJson(res, 500, {
        error: getTelegramErrorMessage(error, 'Unable to upload image to Telegram.'),
      })
    }
  }
}

export function createTelegramImageProxyHandler({ telegramToken }) {
  return async function telegramImageProxyHandler(req, res) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      return sendError(res, 405, 'Method Not Allowed')
    }

    if (!telegramToken) {
      console.error('Missing TELEGRAM_BOT_TOKEN in environment for image proxy')
      return sendError(res, 500, 'Telegram credentials are missing.')
    }

    try {
      const decodedFileId = getQueryFileId(req)
      if (isDevelopmentEnv()) {
        console.log('Incoming image proxy fileId:', decodedFileId)
      }

      if (!decodedFileId) {
        return sendError(res, 400, 'Image file ID is required.')
      }

      const { imageResponse, reference, filePath } = await fetchTelegramFileStream({
        telegramToken,
        decodedFileId,
      })

      if (!imageResponse?.data) {
        return sendJson(res, 500, { error: 'No image stream returned' })
      }

      if (isDevelopmentEnv()) {
        console.log('Resolved proxy filePath:', filePath)
        console.log('Streaming image now...')
      }

      // Production-safe logging for proxy action (no token printed)
      try {
        console.log('Proxying Telegram file', { filePath, referenceType: reference.type, proxiedStatus: imageResponse.status })
      } catch (e) {
        // ignore
      }

      const contentType = imageResponse.headers['content-type']
      const safeContentType =
        contentType && contentType !== 'application/octet-stream'
          ? contentType
          : getMimeTypeFromPath(filePath)

      res.statusCode = 200
      res.setHeader('Content-Type', safeContentType || 'image/jpeg')
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Access-Control-Allow-Origin', '*')

      const contentLength = imageResponse.headers['content-length']
      if (contentLength) {
        res.setHeader('Content-Length', contentLength)
      }

      req.on('close', () => {
        if (imageResponse?.data?.destroy) {
          imageResponse.data.destroy()
        }
      })

      imageResponse.data.on('end', () => {
        if (isDevelopmentEnv()) {
          console.log('Telegram image stream completed')
        }
      })

      imageResponse.data.on('error', (streamError) => {
        console.error('Image stream error:', streamError)

        if (!res.headersSent) {
          sendJson(res, 500, {
            error: 'Image stream failed',
          })
          return
        }

        res.end()
      })

      imageResponse.data.pipe(res)
    } catch (error) {
      const errorDetails = getSafeErrorDetails(error)
      console.error('Telegram image proxy error:', errorDetails)

      if (res.headersSent) {
        res.end()
        return
      }

      const statusCode = Number(error?.statusCode) || Number(error?.response?.status) || 500
      const message =
        statusCode === 404
          ? 'Telegram file path not found'
          : getTelegramErrorMessage(error, 'Unable to fetch image from Telegram.')

      if (isDevelopmentEnv()) {
        return sendJson(res, statusCode, {
          error: message,
          details: errorDetails,
        })
      }

      return sendError(res, statusCode, message)
    }
  }
}

export function createTelegramMediaDeleteHandler({ telegramToken, telegramChannelId }) {
  return async function telegramMediaDeleteHandler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return sendError(res, 405, 'Method Not Allowed')
    }

    if (!telegramToken || !telegramChannelId) {
      return sendError(res, 500, 'Telegram credentials are missing.')
    }

    try {
      const body = await parseJsonBody(req)
      const items = normalizeTelegramDeleteItems(body?.items || body?.images || [])

      if (!items.length) {
        return sendJson(res, 200, {
          deletedCount: 0,
          skippedCount: Array.isArray(body?.items || body?.images) ? (body.items || body.images).length : 0,
          failedCount: 0,
          failures: [],
        })
      }

      const failures = []
      let deletedCount = 0

      for (const item of items) {
        const chatId = item.chat_id || telegramChannelId

        try {
          const telegramResponse = await axios.post(
            `https://api.telegram.org/bot${telegramToken}/deleteMessage`,
            {
              chat_id: chatId,
              message_id: item.message_id,
            }
          )

          if (telegramResponse?.data?.ok) {
            deletedCount += 1
            continue
          }

          failures.push({
            message_id: item.message_id,
            reason: telegramResponse?.data?.description || 'Unable to delete Telegram message.',
          })
        } catch (error) {
          if (isAlreadyDeletedTelegramError(error)) {
            deletedCount += 1
            continue
          }

          failures.push({
            message_id: item.message_id,
            reason: getTelegramErrorMessage(error, 'Unable to delete Telegram message.'),
          })
        }
      }

      return sendJson(res, 200, {
        deletedCount,
        skippedCount: (Array.isArray(body?.items || body?.images) ? (body.items || body.images).length : 0) - items.length,
        failedCount: failures.length,
        failures,
      })
    } catch (error) {
      return sendJson(res, 500, {
        error: getTelegramErrorMessage(error, 'Unable to delete Telegram media.'),
      })
    }
  }
}