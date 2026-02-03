import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

type SearchParams = {
  q?: string
  range?: 'today' | '7d' | 'all'
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

function addDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function statusMeta(status: string) {
  const s = (status || 'scheduled').toLowerCase()

  if (s === 'confirmed') return { label: 'Confirmado', cls: 'statusDot statusGreen' }
  if (s === 'canceled' || s === 'cancelled') return { label: 'Cancelado', cls: 'statusDot statusRed' }
  if (s === 'attended') return { label: 'Compareceu', cls: 'statusDot statusBlue' }
  return { label: 'Agendado', cls: 'statusDot statusYellow' }
}

function fmt(dt: Date) {
  return dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)
  if (!session) return <div className="container">Não autorizado</div>

  const q = (sp.q || '').trim()
  const range = (sp.range || '7d') as 'today' | '7d' | 'all'

  let dateFilter: any = undefined
  if (range === 'today') {
    dateFilter = { gte: startOfToday(), lte: endOfToday() }
  } else if (range === '7d') {
    dateFilter = { gte: startOfToday(), lte: addDays(7) }
  }

  const where: any = {
    tenantId: session.tenantId,
  }

  if (dateFilter) where.date = dateFilter

  if (q) {
    where.patient = {
      name: { contains: q, mode: 'insensitive' },
    }
  }

  const items = await prisma.appointment.findMany({
    where,
    orderBy: { date: 'asc' },
    take: 200,
    select: {
      id: true,
      date: true,
      status: true,
      type: true,
      notes: true,
      patient: { select: { id: true, name: true } },
    },
  })

  const base = '/appointments'
  const linkWith = (next: Partial<SearchParams>) => {
    const params = new URLSearchParams()
    const nq = next.q ?? q
    const nr = next.range ?? range
    if (nq) params.set('q', nq)
    if (nr) params.set('range', nr)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Agendamentos</div>
            <div className="muted" style={{ marginTop: 6 }}>
              {range === 'today' ? 'Hoje' : range === '7d' ? 'Próximos 7 dias' : 'Todos'} • {items.length} itens
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link className="btn btnPrimary" href="/appointments/new">
              + Novo agendamento
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <form action={base} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
            <input
              className="input"
              name="q"
              defaultValue={q}
              placeholder="Buscar paciente..."
              style={{ flex: 1, minWidth: 220 }}
            />
            <input type="hidden" name="range" value={range} />
            <button className="btn" type="submit">Buscar</button>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn" href={linkWith({ range: 'today' })}>Hoje</Link>
              <Link className="btn" href={linkWith({ range: '7d' })}>7 dias</Link>
              <Link className="btn" href={linkWith({ range: 'all' })}>Todos</Link>
            </div>
          </form>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <style>{`
          .apptRow{
            display:flex; justify-content:space-between; gap:12px; align-items:flex-start;
            padding:12px; border-radius:14px; border:1px solid var(--border);
            background: rgba(255,255,255,0.03);
          }
          .statusPill{
            display:inline-flex; align-items:center; gap:8px;
            padding:8px 10px; border-radius:999px; border:1px solid var(--border);
            background: rgba(255,255,255,0.06);
            font-size:13px;
          }
          .statusDot{ width:10px; height:10px; border-radius:999px; }
          .statusGreen{ background: rgba(70,220,140,.95); }
          .statusRed{ background: rgba(255,90,90,.95); }
          .statusBlue{ background: rgba(120,170,255,.95); }
          .statusYellow{ background: rgba(255,210,90,.95); }
        `}</style>

        {items.length === 0 ? (
          <div className="muted">Nenhum agendamento encontrado.</div>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            {items.map((a) => {
              const meta = statusMeta(a.status)
              return (
                <div key={a.id} className="apptRow">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900 }}>{a.patient.name}</div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {fmt(a.date)} • {a.type}
                    </div>
                    {a.notes ? (
                      <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                        {a.notes}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className="statusPill">
                      <span className={meta.cls} />
                      {meta.label}
                    </span>

                    <Link className="btn" href={`/patients/${a.patient.id}`}>
                      Abrir paciente
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
