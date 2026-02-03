import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'

export const dynamic = 'force-dynamic'

function getSessionOrNull(sessionCookie?: string) {
  try {
    return verifySession(sessionCookie)
  } catch {
    return null
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = getSessionOrNull(sessionCookie)

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const patients = await prisma.patient.findMany({
    where: {
      tenantId: session.tenantId,
      active: true,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ patients })
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = getSessionOrNull(sessionCookie)

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()

  // Campos mínimos (o resto pode ser opcional)
  const name = String(body?.name || '').trim()
  if (!name) {
    return NextResponse.json({ message: 'Nome é obrigatório' }, { status: 400 })
  }

  const patient = await prisma.patient.create({
    data: {
      tenantId: session.tenantId,
      name,
      cpf: body?.cpf || null,
      rg: body?.rg || null,
      birthDate: body?.birthDate ? new Date(body.birthDate) : null,
      gender: body?.gender || null,
      phone: body?.phone || null,
      email: body?.email || null,
      address: body?.address || null,
      notes: body?.notes || null,
      active: true,
    },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, id: patient.id })
}
