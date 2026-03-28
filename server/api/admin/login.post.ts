export default defineEventHandler(async (event) => {
  checkRateLimit(event)

  const body = await readBody(event)
  const { password } = body

  if (!verifyAdminPassword(password)) {
    recordFailedLogin(event)
    throw createError({ statusCode: 401, message: 'Wrong password' })
  }

  clearFailedLogins(event)
  const sessionToken = createSession()

  setCookie(event, 'admin-session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  })

  return { ok: true, token: sessionToken }
})
