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

  if (!body?.name || String(body.name).trim().length < 2) {
    return NextResponse.json({ message: 'Nome é obrigatório' }, { status: 400 })
  }

  const patient = await prisma.patient.create({
    data: {
      tenantId: session.tenantId,
      name: String(body.name).trim(),
      cpf: body.cpf ? String(body.cpf).trim() : null,
      rg: body.rg ? String(body.rg).trim() : null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      gender: body.gender ? String(body.gender).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      email: body.email ? String(body.email).trim() : null,
      address: body.address ? String(body.address).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      active: true,
    },
    select: { id: true, name: true },
  })

  return NextResponse.json({ patient })
}
