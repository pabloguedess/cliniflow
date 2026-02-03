import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)
    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim()
    const range = (url.searchParams.get('range') || '7d').trim()

    const startOfToday = () => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    }
    const endOfToday = () => {
      const d = new Date()
      d.setHours(23, 59, 59, 999)
      return d
    }
    const addDays = (days: number) => {
      const d = new Date()
      d.setDate(d.getDate() + days)
      return d
    }

    let dateFilter: any = undefined
    if (range === 'today') dateFilter = { gte: startOfToday(), lte: endOfToday() }
    if (range === '7d') dateFilter = { gte: startOfToday(), lte: addDays(7) }

    const where: any = { tenantId: session.tenantId }
    if (dateFilter) where.date = dateFilter
    if (q) where.patient = { name: { contains: q, mode: 'insensitive' } }

    const items = await prisma.appointment.findMany({
      where,
      orderBy: { date: 'asc' },
      take: 200,
      select: {
        id: true,
        date: true,
        status: true,
        type: true,
        notes: true,
        patient: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ items })
  } catch (e) {
    console.error('GET /api/appointments ERROR:', e)
    return NextResponse.json({ message: 'Erro ao listar' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)
    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const form = await req.formData()
    const patientId = String(form.get('patientId') || '').trim()
    const dateStr = String(form.get('date') || '').trim()
    const type = String(form.get('type') || '').trim()
    const notes = String(form.get('notes') || '').trim()

    if (!patientId || !dateStr || !type) {
      return NextResponse.json({ message: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ message: 'Data inválida' }, { status: 400 })
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: session.tenantId, active: true },
      select: { id: true },
    })
    if (!patient) return NextResponse.json({ message: 'Paciente inválido' }, { status: 404 })

    await prisma.appointment.create({
      data: {
        tenantId: session.tenantId,
        patientId,
        date,
        type,
        notes: notes || null,
        status: 'scheduled',
      },
    })

    // volta pra listagem
    return NextResponse.redirect(new URL('/appointments', req.url))
  } catch (e) {
    console.error('POST /api/appointments ERROR:', e)
    return NextResponse.json({ message: 'Erro ao criar agendamento' }, { status: 500 })
  }
}
