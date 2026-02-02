import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

function toDateTime(date?: string, time?: string) {
  if (!date) return undefined
  const t = time && time.length >= 4 ? time : '00:00'
  return new Date(`${date}T${t}:00`)
}

function buildQuery(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.trim() !== '') sp.set(k, v)
  })
  const q = sp.toString()
  return q ? `?${q}` : ''
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: {
    q?: string
    from?: string
    fromTime?: string
    to?: string
    toTime?: string
    page?: string
  }
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

  const q = (searchParams.q ?? '').trim()
  const fromDT = toDateTime(searchParams.from, searchParams.fromTime)
  const toDT = toDateTime(searchParams.to, searchParams.toTime)

  const page = Math.max(1, Number(searchParams.page ?? '1') || 1)
  const take = 15
  const skip = (page - 1) * take

  const where: any = {
    tenantId: session.tenantId,
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
    ]
  }

  // ✅ filtro por CONSULTA / AGENDAMENTO (Appointment.date)
  if (fromDT || toDT) {
    where.appointments = {
      some: {
        ...(fromDT ? { date: { gte: fromDT } } : {}),
        ...(toDT ? { date: { lte: toDT } } : {}),
      },
    }
  }

  const now = new Date()

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        active: true,
        createdAt: true,
        // Próxima consulta (se existir)
        appointments: {
          where: { date: { gte: now } },
          orderBy: { date: 'asc' },
          take: 1,
          select: {
            id: true,
            date: true,
            type: true,
            status: true,
          },
        },
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / take))

  const baseParams = {
    q: searchParams.q,
    from: searchParams.from,
    fromTime: searchParams.fromTime,
    to: searchParams.to,
    toTime: searchParams.toTime,
  }

  const prevHref = buildQuery({ ...baseParams, page: String(Math.max(1, page - 1)) })
  const nextHref = buildQuery({ ...baseParams, page: String(Math.min(totalPages, page + 1)) })

  return (
    <div style={{ paddingTop: 18 }}>
      {/* Header */}
      <div
        className="card"
        style={{
          padding: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Pacientes</div>
          <div className="muted" style={{ marginTop: 4 }}>
            {total} paciente(s) • página {page} de {totalPages}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link className="btn" href="/patients/new">
            + Novo paciente
          </Link>
          <Link className="btn" href="/appointments/new">
            + Novo agendamento
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <form
        className="card"
        style={{
          padding: 18,
          marginTop: 12,
          display: 'grid',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 0.8fr 1fr 0.8fr auto',
            gap: 10,
          }}
        >
          <input
            name="q"
            defaultValue={q}
            className="input"
            placeholder="Buscar por nome, e-mail ou telefone..."
          />

          <input
            name="from"
            defaultValue={searchParams.from ?? ''}
            className="input"
            type="date"
            title="Data inicial (consulta)"
          />
          <input
            name="fromTime"
            defaultValue={searchParams.fromTime ?? ''}
            className="input"
            type="time"
            title="Hora inicial (consulta)"
          />

          <input
            name="to"
            defaultValue={searchParams.to ?? ''}
            className="input"
            type="date"
            title="Data final (consulta)"
          />
          <input
            name="toTime"
            defaultValue={searchParams.toTime ?? ''}
            className="input"
            type="time"
            title="Hora final (consulta)"
          />

          <button className="btn" type="submit">
            Filtrar
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="muted" style={{ fontSize: 12 }}>
            * Filtro baseado na <b>data/hora da consulta</b> (agendamentos).
          </div>

          <Link className="btn" href="/patients">
            Limpar filtros
          </Link>
        </div>
      </form>

      {/* Lista */}
      <div className="card" style={{ marginTop: 12, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr',
            gap: 10,
            padding: 12,
            borderBottom: '1px solid rgba(255,255,255,.10)',
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 900 }}>Paciente</div>
          <div style={{ fontWeight: 900 }}>Telefone</div>
          <div style={{ fontWeight: 900 }}>E-mail</div>
          <div style={{ fontWeight: 900 }}>Próxima consulta</div>
          <div style={{ fontWeight: 900, textAlign: 'right' }}>Ações</div>
        </div>

        {patients.length === 0 ? (
          <div style={{ padding: 18 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Nenhum paciente encontrado</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Tente ajustar os filtros ou crie um novo paciente/agendamento.
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Link className="btn" href="/patients/new">+ Novo paciente</Link>
              <Link className="btn" href="/appointments/new">+ Novo agendamento</Link>
            </div>
          </div>
        ) : (
          patients.map((p) => {
            const nextAppt = p.appointments?.[0]
            return (
              <div
                key={p.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr',
                  gap: 10,
                  padding: 12,
                  borderBottom: '1px solid rgba(255,255,255,.06)',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ fontWeight: 900 }}>{p.name}</div>

                    <span
                      style={{
                        fontSize: 12,
                        padding: '3px 8px',
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,.12)',
                        opacity: p.active ? 0.95 : 0.6,
                      }}
                    >
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="muted" style={{ fontSize: 12 }}>
                    Criado em {new Date(p.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="muted">{p.phone ?? '—'}</div>
                <div className="muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.email ?? '—'}
                </div>

                <div className="muted" style={{ fontSize: 13 }}>
                  {nextAppt
                    ? `${new Date(nextAppt.date).toLocaleString('pt-BR')} • ${nextAppt.type ?? 'consulta'}`
                    : '—'}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Link className="btn" href={`/appointments/new?patientId=${p.id}`}>Agendar</Link>
                  <Link className="btn" href={`/patients/${p.id}`}>Abrir</Link>
                  <Link className="btn" href={`/patients/${p.id}/records`}>Prontuário</Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 ? (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link className="btn" href={prevHref} aria-disabled={page === 1}>
            ← Anterior
          </Link>

          <div className="muted" style={{ fontSize: 12 }}>
            Página {page} de {totalPages}
          </div>

          <Link className="btn" href={nextHref} aria-disabled={page === totalPages}>
            Próxima →
          </Link>
        </div>
      ) : null}
    </div>
  )
}
