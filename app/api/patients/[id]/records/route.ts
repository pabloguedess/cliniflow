import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)
    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    // garante que paciente é do tenant
    const patient = await prisma.patient.findFirst({
      where: { id, tenantId: session.tenantId, active: true },
      select: { id: true },
    })
    if (!patient) return NextResponse.json({ message: 'Paciente inválido' }, { status: 404 })

    const items = await prisma.medicalRecord.findMany({
      where: { tenantId: session.tenantId, patientId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        complaint: true,
        diagnosis: true,
        prescription: true,
        observations: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ items })
  } catch (e) {
    console.error('GET /api/patients/[id]/records ERROR:', e)
    return NextResponse.json({ message: 'Erro ao listar registros' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)
    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const complaint = body.complaint ? String(body.complaint) : null
    const diagnosis = body.diagnosis ? String(body.diagnosis) : null
    const prescription = body.prescription ? String(body.prescription) : null
    const observations = body.observations ? String(body.observations) : null

    // garante paciente do tenant
    const patient = await prisma.patient.findFirst({
      where: { id, tenantId: session.tenantId, active: true },
      select: { id: true },
    })
    if (!patient) return NextResponse.json({ message: 'Paciente inválido' }, { status: 404 })

    const created = await prisma.medicalRecord.create({
      data: {
        tenantId: session.tenantId,
        patientId: id,
        complaint,
        diagnosis,
        prescription,
        observations,
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, id: created.id })
  } catch (e) {
    console.error('POST /api/patients/[id]/records ERROR:', e)
    return NextResponse.json({ message: 'Erro ao criar registro' }, { status: 500 })
  }
}
