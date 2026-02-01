import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

const ALLOWED = new Set([
  'avatar_1',
  'avatar_2',
  'avatar_3',
  'avatar_4',
  'avatar_5',
  'avatar_6',
])

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const session = verifySession(cookieStore.get('cliniflow_session')?.value)

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const { avatarKey } = await req.json()
  if (!ALLOWED.has(avatarKey)) {
    return NextResponse.json({ message: 'Avatar inválido' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarKey },
  })

  return NextResponse.json({ ok: true })
}
