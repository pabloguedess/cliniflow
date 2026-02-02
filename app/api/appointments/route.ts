import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function toDateSafe(value: any) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)

    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const items = await prisma.appointment.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { date: 'asc' },
      take: 200,
      select: {
        id: true,
        date: true,
        type: true,
        status: true,
        notes: true,
        patientId: true,
        patient: { select: { id: true, name: true, phone: true } },
        createdAt: true,
      },
    })

    return NextResponse.json({ items })
  } catch (e: any) {
    console.error('GET /api/appointments ERROR:', e)
    return NextResponse.json({ message: 'Erro ao listar agendamentos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)

    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const patientId = String(body.patientId || '')
    const type = String(body.type || 'Consulta')
    const notes = body.notes ? String(body.notes) : null

    // aceita date ISO ou string do input
    const date = toDateSafe(body.date)
    if (!patientId || !date) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 })
    }

    // garante que o paciente é do tenant
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: session.tenantId, active: true },
      select: { id: true },
    })
    if (!patient) {
      return NextResponse.json({ message: 'Paciente inválido' }, { status: 400 })
    }

    const created = await prisma.appointment.create({
      data: {
        tenantId: session.tenantId,
        patientId,
        date,
        type,
        status: 'scheduled',
        notes,
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    console.error('POST /api/appointments ERROR:', e)
    return NextResponse.json({ message: 'Erro ao criar agendamento' }, { status: 500 })
  }
}
