import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)
  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const patient = await prisma.patient.findFirst({
    where: { id, tenantId: session.tenantId },
  })

  if (!patient) return NextResponse.json({ message: 'Paciente não encontrado' }, { status: 404 })

  const records = await prisma.medicalRecord.findMany({
    where: { tenantId: session.tenantId, patientId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      complaint: true,
      diagnosis: true,
      prescription: true,
      observations: true,
    },
  })

  const exams = await prisma.exam.findMany({
    where: { tenantId: session.tenantId, patientId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      filename: true,
      url: true,
      contentType: true,
    },
  }).catch(() => [])

  return NextResponse.json({ patient, records, exams })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)
  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const body = await req.json()

  const exists = await prisma.patient.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true },
  })
  if (!exists) return NextResponse.json({ message: 'Paciente não encontrado' }, { status: 404 })

  const updated = await prisma.patient.update({
    where: { id },
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      cpf: body.cpf || null,
      rg: body.rg || null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      gender: body.gender || null,
      address: body.address || null,
      notes: body.notes || null,
    },
  })

  return NextResponse.json({ ok: true, patient: updated })
}
