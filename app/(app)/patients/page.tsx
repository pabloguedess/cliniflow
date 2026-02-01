import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'

export default async function PatientsPage() {
  const cookieStore = await cookies()
const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return <p>Não autorizado</p>
  }

  const patients = await prisma.patient.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div style={{ padding: 24 }}>
      <h1>Pacientes</h1>

      <Link href="/patients/new">
        <button>Novo paciente</button>
      </Link>

      <ul style={{ marginTop: 16 }}>
        {patients.map((p) => (
          <li key={p.id}>
            {p.name} {p.phone && `- ${p.phone}`}
          </li>
        ))}
      </ul>
    </div>
  )
}
