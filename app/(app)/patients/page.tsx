import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'

export default async function PatientsPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return <div className="container">Não autorizado</div>
  }

  const query = searchParams?.q?.trim() || ''

  const patients = await prisma.patient.findMany({
    where: {
      tenantId: session.tenantId,
      ...(query
        ? {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container grid">
      {/* Cabeçalho */}
      <div
        className="card"
        style={{
          padding: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Pacientes</div>
          <div className="muted" style={{ marginTop: 4 }}>
            {patients.length} paciente(s)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <form action="/patients" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar por nome..."
              className="input"
              style={{ minWidth: 220 }}
            />
          </form>

          <Link href="/patients/new" className="btn btnPrimary">
            Novo paciente
          </Link>
        </div>
      </div>

      {/* Lista */}
      <div className="grid">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="card"
            style={{
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontWeight: 800 }}>{patient.name}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                📞 {patient.phone || '—'} &nbsp;•&nbsp; ✉️ {patient.email || '—'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/patients/${patient.id}`} className="btn">
                Abrir
              </Link>

              <Link
                href={`/appointments/new?patientId=${patient.id}`}
                className="btn"
              >
                Agendar
              </Link>
            </div>
          </div>
        ))}

        {patients.length === 0 && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700 }}>Nenhum paciente encontrado</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Tente outro nome ou cadastre um novo paciente.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
