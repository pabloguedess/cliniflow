import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const name = String(body?.name ?? '').trim()
  const phone = body?.phone ? String(body.phone).trim() : null
  const email = body?.email ? String(body.email).trim() : null

  if (!name) {
    return NextResponse.json({ message: 'Nome é obrigatório' }, { status: 400 })
  }

  const patient = await prisma.patient.create({
    data: {
      tenantId: session.tenantId,
      name,
      phone,
      email,
      active: true,
    },
  })

  return NextResponse.json({ patient })
}

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const patients = await prisma.patient.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ patients })
}
