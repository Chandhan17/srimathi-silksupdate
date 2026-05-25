import Razorpay from 'razorpay'
import { createRateLimiter } from '../../server/rateLimit.js'
import { setSecurityHeaders, sendError } from '../../server/http.js'
import { razorpayOrderSchema } from '../../server/validation.js'

const paymentLimiter = createRateLimiter({ keyPrefix: 'payment', windowMs: 60_000, max: 15 })

export default async function handler(req, res) {
  setSecurityHeaders(res)

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendError(res, 405, 'Method Not Allowed')
  }

  if (!paymentLimiter(req, res)) return

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return sendError(res, 500, 'Razorpay credentials are missing.')
  }

  let body = req.body
  try {
    if (typeof body === 'string') body = JSON.parse(body)
  } catch {
    return sendError(res, 400, 'Invalid JSON body')
  }

  const parse = razorpayOrderSchema.safeParse(body || {})
  if (!parse.success) {
    return sendError(res, 400, 'Invalid request', parse.error.format())
  }

  try {
    const { amount, currency, receipt } = parse.data
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const order = await razorpay.orders.create({ amount, currency, receipt, payment_capture: 1 })
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).end(JSON.stringify(order))
  } catch (error) {
    return sendError(res, 500, error?.message || 'Unable to create Razorpay order.')
  }
}
