import { adminAuth, adminEmails } from './firebaseAdmin.js'

function jsonError(res, statusCode, message) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ success: false, message }))
}

export function getBearerToken(req) {
  const header = String(req.headers?.authorization || '')
  if (!header.toLowerCase().startsWith('bearer ')) return ''
  return header.slice(7).trim()
}

export async function verifyAdmin(req, res) {
  const token = getBearerToken(req)
  if (!token) {
    jsonError(res, 401, 'Unauthorized: Missing token')
    return null
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const email = String(decoded.email || '').toLowerCase()

    try {
      console.log('verifyAdmin token decoded:', { uid: decoded.uid, email })
    } catch (e) {}

    if (!email || !adminEmails.includes(email)) {
      jsonError(res, 401, 'Unauthorized: Admin access required')
      return null
    }

    req.user = { uid: decoded.uid, email }
    return req.user
  } catch {
    jsonError(res, 401, 'Unauthorized: Invalid token')
    return null
  }
}
