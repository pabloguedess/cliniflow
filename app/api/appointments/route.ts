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

  const body = await req.json()

  if (!body?.patientId) {
    return NextResponse.json({ message: 'patientId é obrigatório' }, { status: 400 })
  }

  if (!body?.date) {
    return NextResponse.json({ message: 'Data é obrigatória' }, { status: 400 })
  }

  // valida se paciente é do tenant
  const patient = await prisma.patient.findFirst({
    where: { id: String(body.patientId), tenantId: session.tenantId },
    select: { id: true },
  })

  if (!patient) {
    return NextResponse.json({ message: 'Paciente inválido' }, { status: 400 })
  }

  const appt = await prisma.appointment.create({
    data: {
      tenantId: session.tenantId,
      patientId: patient.id,
      professionalId: null,
      date: new Date(body.date),
      type: body.type ? String(body.type) : 'Consulta',
      status: 'scheduled',
      notes: body.notes ? String(body.notes) : null,
    },
    select: { id: true },
  })

  return NextResponse.json({ appointment: appt })
}
