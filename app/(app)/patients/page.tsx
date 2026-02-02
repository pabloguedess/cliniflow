import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

function toDateTime(date?: string, time?: string) {
  if (!date) return undefined
  const t = time && time.length >= 4 ? time : '00:00'
  return new Date(`${date}T${t}:00`)
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; from?: string; to?: string; fromTime?: string; toTime?: string }
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

  const patients = await prisma.patient.findMany({
    where: {
      tenantId: session.tenantId,
      ...(q
        ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] }
        : {}),
      ...(fromDT || toDT
        ? { createdAt: { ...(fromDT ? { gte: fromDT } : {}), ...(toDT ? { lte: toDT } : {}) } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Pacientes</div>
          <div className="muted" style={{ marginTop: 4 }}>
            {patients.length} paciente(s) encontrado(s)
          </div>
        </div>

        <Link className="btn" href="/patients/new">+ Novo paciente</Link>
      </div>

      {/* filtros */}
      <form className="card" style={{ padding: 18, marginTop: 12, display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.8fr 1fr 0.8fr auto', gap: 10 }}>
          <input name="q" defaultValue={q} className="input" placeholder="Buscar por nome, e-mail ou telefone..." />
          <input name="from" defaultValue={searchParams.from ?? ''} className="input" type="date" />
          <input name="fromTime" defaultValue={searchParams.fromTime ?? ''} className="input" type="time" />
          <input name="to" defaultValue={searchParams.to ?? ''} className="input" type="date" />
          <input name="toTime" defaultValue={searchParams.toTime ?? ''} className="input" type="time" />
          <button className="btn" type="submit">Filtrar</button>
        </div>

        <div className="muted" style={{ fontSize: 12 }}>
          * Por enquanto, o filtro usa a data/hora de cadastro do paciente. Depois a gente adiciona filtro por consulta/agendamento.
        </div>
      </form>

      {/* tabela */}
      <div className="card" style={{ padding: 0, marginTop: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', padding: 12, borderBottom: '1px solid rgba(255,255,255,.10)' }}>
          <div style={{ fontWeight: 900 }}>Nome</div>
          <div style={{ fontWeight: 900 }}>Contato</div>
          <div style={{ fontWeight: 900 }}>E-mail</div>
          <div style={{ fontWeight: 900 }}>Ações</div>
        </div>

        {patients.length === 0 ? (
          <div style={{ padding: 18 }} className="muted">Nenhum paciente encontrado.</div>
        ) : (
          patients.map((p) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', padding: 12, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 800 }}>{p.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Criado em {new Date(p.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="muted">{p.phone ?? '—'}</div>
              <div className="muted">{p.email ?? '—'}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Link className="btn" href={`/patients/${p.id}`}>Abrir</Link>
                <Link className="btn" href={`/patients/${p.id}/records`}>Prontuário</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
