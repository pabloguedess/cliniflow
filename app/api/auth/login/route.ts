import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { signSession, cookieHeader } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.password)
    if (!ok) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })
    }

    const sessionValue = signSession({ userId: user.id, tenantId: user.tenantId })

    const res = NextResponse.json({ ok: true })
    res.headers.set('Set-Cookie', cookieHeader(sessionValue))
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}