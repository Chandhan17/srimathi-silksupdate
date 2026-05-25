const ADMIN_EMAILS = (
  import.meta.env.VITE_ADMIN_EMAILS || ''
)
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email?.trim().toLowerCase())
}

export { ADMIN_EMAILS }
