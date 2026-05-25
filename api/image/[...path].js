import { createTelegramImageProxyHandler } from '../_lib/telegramUpload.js'

const baseHandler = createTelegramImageProxyHandler({
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
})

export default async function handler(req, res) {
  // Normalize Vercel catch-all `path` param into `fileId` for backward compatibility.
  // Supports: /api/image/<fileId>  and /api/image/photos/file_123.webp
  try {
    const pathSegments = req.query && req.query.path
    const filePath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments

    console.log('REQ URL:', req.url)
    console.log('QUERY:', req.query)
    console.log('FILE PATH:', filePath)

    if (!req.query) req.query = {}

    if (!req.query.fileId && typeof filePath !== 'undefined') {
      // strip leading slashes if any
      req.query.fileId = String(filePath || '').replace(/^\/+/, '')
    }
  } catch (e) {
    // If normalization fails, continue and let base handler return a safe error
    console.error('Path normalization error:', e?.message || e)
  }

  return baseHandler(req, res)
}
