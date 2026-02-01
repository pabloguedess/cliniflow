import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'

export async function POST(req: Request) {
  const sessionCookie = cookies().get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const { name, phone } = await req.json()

  await prisma.patient.create({
    data: {
      tenantId: session.tenantId,
      name,
      phone,
    },
  })

  return NextResponse.json({ ok: true })
}
