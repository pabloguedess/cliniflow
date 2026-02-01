import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { signSession, cookieHeader } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clinicName, email, password } = body as {
      clinicName: string
      email: string
      password: string
    }

    if (!clinicName || !email || !password) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ message: 'Email já cadastrado' }, { status: 409 })
    }

    const tenant = await prisma.tenant.create({
      data: { name: clinicName },
    })

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        password: await hashPassword(password),
        role: 'admin',
      },
    })

    const sessionValue = signSession({ userId: user.id, tenantId: tenant.id })

    const res = NextResponse.json({ ok: true })
    res.headers.set('Set-Cookie', cookieHeader(sessionValue))
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}