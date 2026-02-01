import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { verifyCode } from '@/lib/codes'
import { hashPassword } from '@/lib/password'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const session = verifySession(cookieStore.get('cliniflow_session')?.value)
  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const { code, newPassword } = await req.json()
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: 'Senha muito curta (min 6)' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passCodeHash: true, codeExpiresAt: true },
  })

  if (!user?.passCodeHash || !user.codeExpiresAt) {
    return NextResponse.json({ message: 'Nenhuma troca de senha pendente' }, { status: 400 })
  }

  if (user.codeExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ message: 'Código expirado' }, { status: 400 })
  }

  const ok = await verifyCode(code, user.passCodeHash)
  if (!ok) return NextResponse.json({ message: 'Código inválido' }, { status: 400 })

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      password: await hashPassword(newPassword),
      passCodeHash: null,
      codeExpiresAt: null,
    },
  })

  return NextResponse.json({ ok: true })
}
