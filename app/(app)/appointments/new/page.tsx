import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import NewAppointmentForm from '@/components/appointments/NewAppointmentForm'

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: { patientId?: string }
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) return <div className="container">Não autorizado</div>

  const patients = await prisma.patient.findMany({
    where: { tenantId: session.tenantId, active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <NewAppointmentForm
      patients={patients}
      initialPatientId={searchParams.patientId ?? ''}
    />
  )
}
