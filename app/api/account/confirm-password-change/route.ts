import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { sha256 } from '@/lib/crypto'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const code = String(body?.code ?? '').trim()
  const newPassword = String(body?.newPassword ?? '').trim()

  if (!code || code.length < 4) {
    return NextResponse.json({ message: 'Código inválido' }, { status: 400 })
  }

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: 'Senha muito curta (mín. 6)' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      passwordCodeHash: true,
      passwordCodeExpires: true,
      pendingPasswordHash: true,
    },
  })

  if (!user?.passwordCodeHash || !user.passwordCodeExpires) {
    return NextResponse.json({ message: 'Não há troca de senha pendente' }, { status: 400 })
  }

  if (user.passwordCodeExpires.getTime() < Date.now()) {
    return NextResponse.json({ message: 'Código expirado' }, { status: 400 })
  }

  const codeHash = sha256(code)

  if (codeHash !== user.passwordCodeHash) {
    return NextResponse.json({ message: 'Código incorreto' }, { status: 400 })
  }

  // ✅ Se já existe pendingPasswordHash (fluxo onde a senha foi pré-hash),
  // usamos ela. Se não existir, fazemos o hash agora.
  const passwordHash =
    user.pendingPasswordHash && user.pendingPasswordHash.length > 10
      ? user.pendingPasswordHash
      : await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      password: passwordHash,
      pendingPasswordHash: null,
      passwordCodeHash: null,
      passwordCodeExpires: null,
    },
  })

  return NextResponse.json({ ok: true })
}
