// Simple in-memory rate limiter for Vercel serverless functions.
// Note: in-memory limits are per-instance. For global limits use Redis/Upstash.
const buckets = new Map()

function now() {
  return Date.now()
}

function getIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

export function createRateLimiter({ keyPrefix = 'rl', windowMs = 60000, max = 60 } = {}) {
  return function rateLimit(req, res) {
    const ip = getIp(req)
    const key = `${keyPrefix}:${ip}`
    const entry = buckets.get(key)

    if (!entry || now() > entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now() + windowMs })
      return true
    }

    if (entry.count >= max) {
      res.statusCode = 429
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, message: 'Too many requests, slow down.' }))
      return false
    }

    entry.count += 1
    return true
  }
}
