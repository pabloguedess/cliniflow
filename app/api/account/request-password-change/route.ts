import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { generateCode, hashCode } from '@/lib/codes'
import { sendCodeEmail } from '@/lib/email'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)

    if (!session) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    })

    if (!user?.email) {
      return NextResponse.json({ message: 'Usuário sem email' }, { status: 400 })
    }

    const code = generateCode()

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        passwordCodeHash: await hashCode(code),
        codeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    })

    // ✅ assinatura de 3 args (to, subject, code)
    await sendCodeEmail(user.email, 'Código para alterar senha', code)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}
