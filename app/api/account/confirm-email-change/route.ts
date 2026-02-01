import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { verifyCode } from '@/lib/codes'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const session = verifySession(cookieStore.get('cliniflow_session')?.value)
  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const { code } = await req.json()

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { pendingEmail: true, emailCodeHash: true, codeExpiresAt: true },
  })

  if (!user?.pendingEmail || !user.emailCodeHash || !user.codeExpiresAt) {
    return NextResponse.json({ message: 'Nenhuma troca de email pendente' }, { status: 400 })
  }

  if (user.codeExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ message: 'Código expirado' }, { status: 400 })
  }

  const ok = await verifyCode(code, user.emailCodeHash)
  if (!ok) return NextResponse.json({ message: 'Código inválido' }, { status: 400 })

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      email: user.pendingEmail,
      pendingEmail: null,
      emailCodeHash: null,
      codeExpiresAt: null,
    },
  })

  return NextResponse.json({ ok: true })
}
