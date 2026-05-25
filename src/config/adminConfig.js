export const ADMIN_EMAILS = [
  'srimathisilks7@gmail.com',
]

export function isAdminEmail(email) {
  if (!email) return false
  return ADMIN_EMAILS.includes(String(email).toLowerCase())
}
