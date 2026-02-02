import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

function toDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const patientId = String(body?.patientId ?? '').trim()
  const date = String(body?.date ?? '').trim()
  const time = String(body?.time ?? '').trim()
  const type = String(body?.type ?? 'Consulta').trim()
  const notes = body?.notes ? String(body.notes).trim() : null

  if (!patientId) return NextResponse.json({ message: 'patientId é obrigatório' }, { status: 400 })
  if (!date) return NextResponse.json({ message: 'Data é obrigatória' }, { status: 400 })
  if (!time) return NextResponse.json({ message: 'Horário é obrigatório' }, { status: 400 })

  // valida se o paciente pertence ao tenant
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId: session.tenantId },
    select: { id: true },
  })

  if (!patient) return NextResponse.json({ message: 'Paciente inválido' }, { status: 400 })

  const appt = await prisma.appointment.create({
    data: {
      tenantId: session.tenantId,
      patientId,
      professionalId: null,
      date: toDateTime(date, time),
      type,
      notes,
      status: 'scheduled',
    },
    select: { id: true },
  })

  return NextResponse.json({ appointmentId: appt.id })
}
