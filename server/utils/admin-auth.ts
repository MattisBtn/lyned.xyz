import type { H3Event } from 'h3'
import { timingSafeEqual, randomBytes } from 'crypto'

// C2: No fallback — fail hard if env var missing
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
if (!ADMIN_PASSWORD) {
  console.error('FATAL: ADMIN_PASSWORD env var is required')
}

// C1: Session tokens instead of password-in-cookie
const sessions = new Map<string, { expires: number }>()

// H1: Rate limiting
const loginAttempts = new Map<string, { count: number, lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 min

function safeCompare(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export function checkRateLimit(event: H3Event) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const record = loginAttempts.get(ip)
  if (record && record.lockedUntil > Date.now()) {
    throw createError({ statusCode: 429, message: 'Too many attempts. Try again later.' })
  }
}

export function recordFailedLogin(event: H3Event) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 }
  record.count++
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_MS
    record.count = 0
  }
  loginAttempts.set(ip, record)
}

export function clearFailedLogins(event: H3Event) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  loginAttempts.delete(ip)
}

export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false
  return safeCompare(password, ADMIN_PASSWORD)
}

export function createSession(): string {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { expires: Date.now() + 24 * 60 * 60 * 1000 }) // 24h
  // Cleanup expired sessions
  for (const [k, v] of sessions) {
    if (v.expires < Date.now()) sessions.delete(k)
  }
  return token
}

function isValidSession(token: string): boolean {
  const session = sessions.get(token)
  if (!session) return false
  if (session.expires < Date.now()) {
    sessions.delete(token)
    return false
  }
  return true
}

export function checkAdminAuth(event: H3Event) {
  // Check session cookie
  const cookie = getCookie(event, 'admin-session')
  if (cookie && isValidSession(cookie)) return

  // Check x-admin-token header (session token, not password)
  const headers = getHeaders(event)
  const headerToken = headers['x-admin-token'] || ''
  if (headerToken && isValidSession(headerToken)) return

  throw createError({ statusCode: 401, message: 'Unauthorized' })
}
