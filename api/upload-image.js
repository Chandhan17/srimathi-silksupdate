import { createTelegramImageHandler } from './_lib/telegramUpload.js'
import { verifyAdmin } from '../server/verifyAdmin.js'
import { createRateLimiter } from '../server/rateLimit.js'
import { setSecurityHeaders } from '../server/http.js'

const uploadLimiter = createRateLimiter({ keyPrefix: 'upload', windowMs: 60_000, max: 20 })

export default async function handler(req, res) {
  setSecurityHeaders(res)

  // Verify admin token
  const user = await verifyAdmin(req, res)
  if (!user) return

  // Rate limit uploads
  if (!uploadLimiter(req, res)) return

  // Delegate to existing handler
  return createTelegramImageHandler({
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChannelId: process.env.TELEGRAM_CHANNEL_ID,
  })(req, res)
}