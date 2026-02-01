import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APP_PREFIX = '/(app)' // não funciona direto no path real

// vamos proteger rotas reais: /dashboard, /patients, /billing etc.
const PROTECTED = ['/dashboard', '/patients', '/billing', '/profile']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p))

  if (!needsAuth) return NextResponse.next()

  const session = req.cookies.get('cliniflow_session')?.value
  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/patients/:path*', '/billing/:path*', '/profile/:path*'],
}
