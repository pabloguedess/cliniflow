import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import NewAppointmentForm from './ui'

export const dynamic = 'force-dynamic'

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card" style={{ padding: 18 }}>
          Não autorizado. <Link className="btn" href="/login" style={{ marginLeft: 10 }}>Ir para login</Link>
        </div>
      </div>
    )
  }

  const patientIdRaw = searchParams?.patientId
  const patientId = Array.isArray(patientIdRaw) ? patientIdRaw[0] : patientIdRaw

  // Se veio patientId, buscamos só ele
  const fixedPatient = patientId
    ? await prisma.patient.findFirst({
        where: { id: patientId, tenantId: session.tenantId },
        select: { id: true, name: true },
      })
    : null

  // Se não veio patientId, listamos pacientes para dropdown
  const patients = !patientId
    ? await prisma.patient.findMany({
        where: { tenantId: session.tenantId, active: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true },
      })
    : []

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Novo agendamento</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Informe data/horário e tipo. O paciente {fixedPatient ? 'já está selecionado.' : 'pode ser escolhido abaixo.'}
        </div>
        <div style={{ marginTop: 10 }}>
          <Link className="btn" href={fixedPatient ? `/patients/${fixedPatient.id}` : '/patients'}>Voltar</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 18 }}>
        <NewAppointmentForm
          fixedPatient={fixedPatient ? { id: fixedPatient.id, name: fixedPatient.name } : null}
          patients={patients.map(p => ({ id: p.id, name: p.name }))}
        />
      </div>
    </div>
  )
}
