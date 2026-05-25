/* global process */
export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Minimal CSP allowing scripts/styles from self and Razorpay checkout
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.telegram.org https://api.razorpay.com https://*.googleapis.com https://firestore.googleapis.com"
  )
}

export function sendError(res, statusCode, message, details) {
  const payload = { success: false, message }
  if (details && process.env.NODE_ENV !== 'production') payload.details = details
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}
