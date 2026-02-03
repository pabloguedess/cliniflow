import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import EditPatientForm from '@/components/EditPatientForm'

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return <div className="container">Não autorizado</div>
  }

  const patient = await prisma.patient.findFirst({
    where: { id, tenantId: session.tenantId },
  })

  if (!patient) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Paciente não encontrado</div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/patients">Voltar</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 20 }}>Editar ficha</div>
            <div className="muted" style={{ marginTop: 6 }}>{patient.name}</div>
          </div>
          <Link className="btn" href={`/patients/${patient.id}`}>Voltar</Link>
        </div>
      </div>

      <EditPatientForm patient={patient as any} />
    </div>
  )
}
