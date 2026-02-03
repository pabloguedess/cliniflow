import { NextRequest, NextResponse } from 'next/server'
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

// Next (versões novas) tipa params como Promise
type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = getSessionOrNull(sessionCookie)

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      tenantId: session.tenantId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      cpf: true,
      rg: true,
      birthDate: true,
      gender: true,
      address: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!patient) {
    return NextResponse.json({ message: 'Paciente não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ patient })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = getSessionOrNull(sessionCookie)

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  // Soft delete
  const updated = await prisma.patient.updateMany({
    where: {
      id,
      tenantId: session.tenantId,
      active: true,
    },
    data: { active: false },
  })

  if (updated.count === 0) {
    return NextResponse.json({ message: 'Paciente não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
