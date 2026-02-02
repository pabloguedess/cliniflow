import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function formatDT(d: Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d)
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) return <div className="container">Não autorizado</div>

  const now = new Date()

  const [patientsCount, upcoming] = await Promise.all([
    prisma.patient.count({ where: { tenantId: session.tenantId, active: true } }),
    prisma.appointment.findMany({
      where: { tenantId: session.tenantId, date: { gte: now } },
      orderBy: { date: 'asc' },
      take: 6,
      select: {
        id: true,
        date: true,
        type: true,
        status: true,
        patient: { select: { id: true, name: true } },
      },
    }),
  ])

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Dashboard</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Visão geral do seu painel.
        </div>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Pacientes ativos</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 10 }}>{patientsCount}</div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/patients">Ver pacientes</Link>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Próximos agendamentos</div>
          <div className="muted" style={{ marginTop: 6 }}>
            (mostrando os próximos 6)
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {upcoming.length === 0 ? (
              <div className="muted">Nenhum agendamento futuro.</div>
            ) : (
              upcoming.map((a) => (
                <div key={a.id} className="card" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 900 }}>{a.patient?.name || 'Paciente'}</div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    {formatDT(new Date(a.date))} • {a.type}
                  </div>
                  {a.patient?.id ? (
                    <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Link className="btn" href={`/patients/${a.patient.id}`}>Abrir paciente</Link>
                      <Link className="btn" href="/appointments">Ver agenda</Link>
                    </div>
                  ) : (
                    <div style={{ marginTop: 10 }}>
                      <Link className="btn" href="/appointments">Ver agenda</Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
