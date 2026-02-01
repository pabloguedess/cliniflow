import crypto from 'crypto'

export const COOKIE_NAME = 'cliniflow_session'

export function signSession(payloadObj: { userId: string; tenantId: string }) {
  const payload = JSON.stringify({ ...payloadObj, t: Date.now() })

  const signature = crypto
    .createHmac('sha256', process.env.SESSION_SECRET!)
    .update(payload)
    .digest('hex')

  const value = Buffer.from(payload).toString('base64') + '.' + signature
  return value
}

export function verifySession(value: string | undefined | null) {
  if (!value) return null
  const [payloadB64, signature] = value.split('.')
  if (!payloadB64 || !signature) return null

  const payload = Buffer.from(payloadB64, 'base64').toString('utf8')

  const expected = crypto
    .createHmac('sha256', process.env.SESSION_SECRET!)
    .update(payload)
    .digest('hex')

  if (expected !== signature) return null

  return JSON.parse(payload) as { userId: string; tenantId: string; t: number }
}

export function cookieHeader(value: string) {
  const isProd = process.env.NODE_ENV === 'production'
  // 30 dias
  const maxAge = 60 * 60 * 24 * 30

  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${
    isProd ? 'Secure;' : ''
  }`
}

export function clearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`
}