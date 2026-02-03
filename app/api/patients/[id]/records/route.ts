import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const records = await prisma.medicalRecord.findMany({
    where: { tenantId: session.tenantId, patientId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ records })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const complaint = body?.complaint ? String(body.complaint) : null
  const diagnosis = body?.diagnosis ? String(body.diagnosis) : null
  const prescription = body?.prescription ? String(body.prescription) : null
  const observations = body?.observations ? String(body.observations) : null

  // garante que o paciente pertence ao tenant
  const patient = await prisma.patient.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true },
  })
  if (!patient) return NextResponse.json({ message: 'Paciente não encontrado' }, { status: 404 })

  const rec = await prisma.medicalRecord.create({
    data: {
      tenantId: session.tenantId,
      patientId: id,
      complaint,
      diagnosis,
      prescription,
      observations,
    },
  })

  return NextResponse.json({ ok: true, record: rec })
}
