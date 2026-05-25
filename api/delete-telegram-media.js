import { createTelegramMediaDeleteHandler } from './_lib/telegramUpload.js'
import { verifyAdmin } from '../server/verifyAdmin.js'
import { createRateLimiter } from '../server/rateLimit.js'
import { setSecurityHeaders, sendError } from '../server/http.js'
import { deleteTelegramSchema } from '../server/validation.js'

const deleteLimiter = createRateLimiter({ keyPrefix: 'delete', windowMs: 60_000, max: 30 })

export default async function handler(req, res) {
  setSecurityHeaders(res)

  // Admin check
  const user = await verifyAdmin(req, res)
  if (!user) return

  // Rate limit
  if (!deleteLimiter(req, res)) return

  // Validate request body
  let body = req.body
  try {
    if (typeof body === 'string') body = JSON.parse(body)
  } catch {
    return sendError(res, 400, 'Invalid JSON body')
  }

  const parse = deleteTelegramSchema.safeParse(body || {})
  if (!parse.success) {
    return sendError(res, 400, 'Invalid request', parse.error.format())
  }

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHANNEL_ID) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID in env for delete-telegram-media')
    return sendError(res, 500, 'Server configuration error')
  }

  return createTelegramMediaDeleteHandler({
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChannelId: process.env.TELEGRAM_CHANNEL_ID,
  })(req, res)
}