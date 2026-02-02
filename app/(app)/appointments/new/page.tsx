import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import AppointmentForm from './ui'

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams?: { patientId?: string }
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card" style={{ padding: 18 }}>Não autorizado</div>
      </div>
    )
  }

  const patientId = searchParams?.patientId

  // ✅ Se veio patientId, busca só ele e trava o formulário
  const lockedPatient = patientId
    ? await prisma.patient.findFirst({
        where: { id: patientId, tenantId: session.tenantId },
        select: { id: true, name: true },
      })
    : null

  // ✅ Se não veio patientId, lista para escolher
  const patients = lockedPatient
    ? []
    : await prisma.patient.findMany({
        where: { tenantId: session.tenantId, active: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true },
        take: 300,
      })

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Novo agendamento</div>
        <div className="muted" style={{ marginTop: 6 }}>
          {lockedPatient
            ? <>Agendando para: <b>{lockedPatient.name}</b></>
            : 'Selecione o paciente e informe data/horário.'}
        </div>
        <div style={{ marginTop: 12 }}>
          <Link className="btn" href={lockedPatient ? `/patients/${lockedPatient.id}` : '/patients'}>
            Voltar
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 18 }}>
        <AppointmentForm lockedPatient={lockedPatient} patients={patients} />
      </div>
    </div>
  )
}
