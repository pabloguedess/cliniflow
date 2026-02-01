import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { generateCode, hashCode } from '@/lib/codes'
import { sendCodeEmail } from '@/lib/email'

export async function POST() {
  const cookieStore = await cookies()
  const session = verifySession(cookieStore.get('cliniflow_session')?.value)
  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  })
  if (!user) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })

  const code = generateCode()

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      passCodeHash: await hashCode(code),
      codeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  await sendCodeEmail(user.email, code, 'Código para trocar sua senha')

  return NextResponse.json({ ok: true })
}
