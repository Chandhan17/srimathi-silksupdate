import { createTelegramImageHandler } from './_lib/telegramUpload.js'
import { verifyAdmin } from '../server/verifyAdmin.js'
import { createRateLimiter } from '../server/rateLimit.js'
import { setSecurityHeaders, sendError } from '../server/http.js'

const uploadLimiter = createRateLimiter({ keyPrefix: 'upload', windowMs: 60_000, max: 20 })

export default async function handler(req, res) {
  setSecurityHeaders(res)

  // Verify admin token
  const user = await verifyAdmin(req, res)
  if (!user) return

  // Rate limit uploads
  if (!uploadLimiter(req, res)) return

  // Delegate to existing handler
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHANNEL_ID) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID in env for uploads')
    return sendError(res, 500, 'Server configuration error')
  }

  return createTelegramImageHandler({
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChannelId: process.env.TELEGRAM_CHANNEL_ID,
  })(req, res)
}