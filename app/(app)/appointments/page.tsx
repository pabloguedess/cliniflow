import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function formatDT(d: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q || '').trim()
  const fromRaw = sp.from || ''
  const toRaw = sp.to || ''

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) return <div className="container">Não autorizado</div>

  const from = fromRaw ? new Date(fromRaw) : null
  const to = toRaw ? new Date(toRaw) : null

  const where: any = { tenantId: session.tenantId }
  if (from && !isNaN(from.getTime())) where.date = { ...(where.date || {}), gte: from }
  if (to && !isNaN(to.getTime())) where.date = { ...(where.date || {}), lte: to }
  if (q) where.patient = { name: { contains: q, mode: 'insensitive' } }

  const items = await prisma.appointment.findMany({
    where,
    orderBy: { date: 'asc' },
    take: 500,
    select: {
      id: true,
      date: true,
      type: true,
      status: true,
      patient: { select: { id: true, name: true, phone: true } },
    },
  })

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>Agendamentos</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Total: {items.length}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn" href="/patients">Pacientes</Link>
            <Link className="btn" href="/dashboard">Dashboard</Link>
          </div>
        </div>

        <form style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 200px 200px 120px', gap: 10 }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome do paciente..."
            className="input"
          />
          <input
            name="from"
            defaultValue={fromRaw}
            placeholder="De (YYYY-MM-DD)"
            className="input"
          />
          <input
            name="to"
            defaultValue={toRaw}
            placeholder="Até (YYYY-MM-DD)"
            className="input"
          />
          <button className="btn" type="submit">Filtrar</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 18 }}>
        {items.length === 0 ? (
          <div className="muted">Nenhum agendamento encontrado.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((a) => (
              <div key={a.id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{a.patient?.name || 'Paciente'}</div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    {formatDT(new Date(a.date))} • {a.type} • {a.status}
                  </div>
                  {a.patient?.phone ? (
                    <div className="muted" style={{ marginTop: 6 }}>Tel: {a.patient.phone}</div>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {a.patient?.id ? (
                    <Link className="btn" href={`/patients/${a.patient.id}`}>Abrir paciente</Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
