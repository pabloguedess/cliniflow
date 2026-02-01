import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return NextResponse.json(
      { message: 'Não autorizado' },
      { status: 401 }
    )
  }

  const body = await req.json()

  // lógica provisória
  return NextResponse.json({
    message: 'Paciente criado (mock)',
    data: body,
  })
}
