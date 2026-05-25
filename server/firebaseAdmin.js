/* global process */
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function parseAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function buildCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    } catch {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON')
    }
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key may contain \n sequences when loaded from env
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
    })
  }

  return applicationDefault()
}

function getAdminApp() {
  if (!getApps().length) {
    initializeApp({ credential: buildCredential() })
  }
  return getApps()[0]
}

export const adminAuth = getAuth(getAdminApp())
export const adminEmails = parseAdminEmails()
