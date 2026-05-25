import { createTelegramImageProxyHandler } from '../_lib/telegramUpload.js'

const baseHandler = createTelegramImageProxyHandler({
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
})

export default async function handler(req, res) {
  // Normalize Vercel catch-all `path` param into `fileId` for backward compatibility.
  // Supports: /api/image/<fileId>  and /api/image/photos/file_123.webp
  try {
    const pathSegments = req.query && req.query.path

    if (!req.query) req.query = {}

    if (!req.query.fileId && typeof pathSegments !== 'undefined') {
      const fileId = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments
      // strip leading slashes if any
      req.query.fileId = String(fileId || '').replace(/^\/+/, '')
    }
  } catch (e) {
    // If normalization fails, continue and let base handler return a safe error
    console.error('Path normalization error:', e?.message || e)
  }

  return baseHandler(req, res)
}
