import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)

    if (!session) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ message: 'ID inválido' }, { status: 400 })
    }

    // Soft delete: não apaga do banco (preserva histórico)
    const updated = await prisma.patient.updateMany({
      where: {
        id,
        tenantId: session.tenantId,
        active: true,
      },
      data: {
        active: false,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { message: 'Paciente não encontrado ou já excluído' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('DELETE /api/patients/[id] ERROR:', e)
    return NextResponse.json({ message: 'Erro ao excluir paciente' }, { status: 500 })
  }
}
