import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { generateCode, hashCode } from '@/lib/codes'
import { sendCodeEmail } from '@/lib/email'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const session = verifySession(cookieStore.get('cliniflow_session')?.value)
  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const { newEmail } = await req.json()
  if (!newEmail) return NextResponse.json({ message: 'Email inválido' }, { status: 400 })

  const exists = await prisma.user.findUnique({ where: { email: newEmail } })
  if (exists) return NextResponse.json({ message: 'Esse email já está em uso' }, { status: 409 })

  const code = generateCode()
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      pendingEmail: newEmail,
      emailCodeHash: await hashCode(code),
      codeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  await sendCodeEmail(newEmail, code, 'Código para trocar seu email')

  return NextResponse.json({ ok: true })
}
