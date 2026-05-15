// Shared cookie helpers used by AppProvider and registro flow.
// Read by Next.js middleware for server-side route protection.

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function setSessionCookie(role: string) {
  if (typeof document === 'undefined') return
  document.cookie = `stockia-session=1; path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
  document.cookie = `stockia-role=${role}; path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
}

export function clearSessionCookie() {
  if (typeof document === 'undefined') return
  document.cookie = 'stockia-session=; path=/; Max-Age=0'
  document.cookie = 'stockia-role=; path=/; Max-Age=0'
}
