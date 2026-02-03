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

    if (!q) return NextResponse.json({ items: [] })

    const items = await prisma.patient.findMany({
      where: {
        tenantId: session.tenantId,
        active: true,
        name: { contains: q, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: 12,
      select: { id: true, name: true },
    })

    return NextResponse.json({ items })
  } catch (e) {
    console.error('GET /api/patients/search ERROR:', e)
    return NextResponse.json({ message: 'Erro ao buscar pacientes' }, { status: 500 })
  }
}
