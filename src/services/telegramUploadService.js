import axios from 'axios'
import { getIdToken } from './authService'

const uploadEndpoint = import.meta.env.VITE_IMAGE_UPLOAD_ENDPOINT || '/api/upload-image'

function buildProxyUrl(fileRef) {
  if (!fileRef) return ''
  return `/api/image/${encodeURIComponent(fileRef)}`
}

function buildFormData(file) {
  const formData = new FormData()
  formData.append('image', file)
  return formData
}

export async function uploadSingleImage(file) {
  if (!file) {
    throw new Error('No image file was provided.')
  }

  if (!file.type?.startsWith('image/')) {
    throw new Error('Only image files are allowed.')
  }

  let response
  try {
    const token = await getIdToken()
    response = await axios.post(uploadEndpoint, buildFormData(file), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.details?.description ||
      error?.message ||
      'Image upload failed.'
    throw new Error(message)
  }

  const fileId = response.data.file_id || null
  const filePath = response.data.file_path || null
  const telegramMessageId = response.data.telegram_message_id || null
  const telegramChatId = response.data.telegram_chat_id || null
  const resolvedUrl = buildProxyUrl(fileId || filePath)

  if (!resolvedUrl && !response.data?.url) {
    throw new Error('Image upload failed.')
  }

  return {
    url: resolvedUrl || response.data.url,
    public_id: null,
    file_id: fileId,
    file_path: filePath,
    telegram_message_id: telegramMessageId,
    telegram_chat_id: telegramChatId,
  }
}

export async function uploadMultipleImages(files) {
  if (!files?.length) {
    return { success: [], failedCount: 0, errors: [] }
  }

  const results = await Promise.allSettled(files.map((file) => uploadSingleImage(file)))
  const success = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
  const failedResults = results.filter((result) => result.status === 'rejected')
  const failedCount = failedResults.length
  const errors = failedResults.map((result) => result.reason?.message || 'Image upload failed.')

  return {
    success,
    failedCount,
    errors,
  }
}