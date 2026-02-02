import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import AppointmentForm from './ui'

export const dynamic = 'force-dynamic'

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const sp = await searchParams

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) return <div className="container">Não autorizado</div>

  const patients = await prisma.patient.findMany({
    where: { tenantId: session.tenantId, active: true },
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
  })

  const preselectedId = sp.patientId || ''
  const preselected = preselectedId
    ? await prisma.patient.findFirst({
        where: { id: preselectedId, tenantId: session.tenantId, active: true },
        select: { id: true, name: true },
      })
    : null

  return (
    <div className="container">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 26, fontWeight: 900 }}>Novo agendamento</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Informe data/horário e tipo.
          {preselected ? ' O paciente já está definido.' : ' Busque o paciente pelo nome.'}
        </div>
        <div style={{ marginTop: 12 }}>
          <Link className="btn" href={preselected ? `/patients/${preselected.id}` : '/appointments'}>
            Voltar
          </Link>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <AppointmentForm
        patients={patients}
        lockedPatient={preselected ? { id: preselected.id, name: preselected.name } : null}
      />
    </div>
  )
}
