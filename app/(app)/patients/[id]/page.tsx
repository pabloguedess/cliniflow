import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export default async function PatientDetailsPage({
  params,
}: {
  params: { id: string }
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

  const patientId = params.id

  // Busca paciente + próximas/últimas consultas
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId: session.tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      createdAt: true,
      birthDate: true,
      gender: true,
      cpf: true,
      rg: true,
      address: true,
      notes: true,
      appointments: {
        orderBy: { date: 'desc' },
        take: 10,
        select: {
          id: true,
          date: true,
          type: true,
          status: true,
          notes: true,
        },
      },
      records: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          complaint: true,
          diagnosis: true,
          prescription: true,
          observations: true,
        },
      },
    },
  })

  if (!patient) {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Paciente não encontrado</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Esse paciente não existe ou não pertence à sua clínica.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/patients">Voltar para pacientes</Link>
          </div>
        </div>
      </div>
    )
  }

  const nextAppt = await prisma.appointment.findFirst({
    where: { tenantId: session.tenantId, patientId: patient.id, date: { gte: new Date() } },
    orderBy: { date: 'asc' },
    select: { date: true, type: true, status: true },
  })

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
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{patient.name}</div>
            <span
              style={{
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,.14)',
                opacity: patient.active ? 0.95 : 0.6,
              }}
            >
              {patient.active ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          <div className="muted" style={{ fontSize: 13 }}>
            ID: {patient.id}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link className="btn" href={`/appointments/new?patientId=${patient.id}`}>
            + Agendar
          </Link>
          <Link className="btn" href={`/patients/${patient.id}/records`}>
            Prontuário
          </Link>
          <Link className="btn" href="/patients">
            Voltar
          </Link>
        </div>
      </div>

      {/* Cards topo */}
      <div
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: 12,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Contato</div>
          <div className="muted" style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            <div><b>Email:</b> {patient.email ?? '—'}</div>
            <div><b>Telefone:</b> {patient.phone ?? '—'}</div>
            <div><b>Endereço:</b> {patient.address ?? '—'}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Próxima consulta</div>
          <div className="muted" style={{ marginTop: 8 }}>
            {nextAppt
              ? `${new Date(nextAppt.date).toLocaleString('pt-BR')} • ${nextAppt.type ?? 'Consulta'}`
              : 'Sem consulta futura agendada'}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Link className="btn" href={`/appointments/new?patientId=${patient.id}`}>
              Agendar agora
            </Link>
          </div>
        </div>
      </div>

      {/* Seções */}
      <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
        {/* Dados clínicos básicos */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Ficha</div>

          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
            }}
          >
            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Nascimento</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>
                {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : '—'}
              </div>
            </div>

            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Gênero</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>{patient.gender ?? '—'}</div>
            </div>

            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Cadastro</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>
                {new Date(patient.createdAt).toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>CPF</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>{patient.cpf ?? '—'}</div>
            </div>

            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>RG</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>{patient.rg ?? '—'}</div>
            </div>

            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Observações</div>
              <div className="muted" style={{ marginTop: 6 }}>
                {patient.notes ?? '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Consultas */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Consultas / Agendamentos</div>
              <div className="muted" style={{ marginTop: 4 }}>
                Últimas 10 consultas (mais recente primeiro)
              </div>
            </div>

            <Link className="btn" href={`/appointments/new?patientId=${patient.id}`}>
              + Novo agendamento
            </Link>
          </div>

          {patient.appointments.length === 0 ? (
            <div style={{ marginTop: 12 }} className="muted">
              Nenhuma consulta encontrada para este paciente.
            </div>
          ) : (
            <div style={{ marginTop: 12, overflow: 'hidden' }} className="card">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr',
                  gap: 10,
                  padding: 12,
                  borderBottom: '1px solid rgba(255,255,255,.10)',
                }}
              >
                <div style={{ fontWeight: 900 }}>Data</div>
                <div style={{ fontWeight: 900 }}>Tipo</div>
                <div style={{ fontWeight: 900 }}>Status</div>
              </div>

              {patient.appointments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr',
                    gap: 10,
                    padding: 12,
                    borderBottom: '1px solid rgba(255,255,255,.06)',
                  }}
                >
                  <div className="muted">{new Date(a.date).toLocaleString('pt-BR')}</div>
                  <div className="muted">{a.type ?? 'Consulta'}</div>
                  <div className="muted">{a.status ?? 'scheduled'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo do prontuário */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Prontuário</div>
              <div className="muted" style={{ marginTop: 4 }}>
                Últimos registros clínicos
              </div>
            </div>

            <Link className="btn" href={`/patients/${patient.id}/records`}>Ver tudo</Link>
          </div>

          {patient.records.length === 0 ? (
            <div style={{ marginTop: 12 }} className="muted">
              Nenhum registro clínico ainda.
            </div>
          ) : (
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {patient.records.map((r) => (
                <div key={r.id} className="card" style={{ padding: 14 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {new Date(r.createdAt).toLocaleString('pt-BR')}
                  </div>
                  <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                    <div><b>Queixa:</b> {r.complaint ?? '—'}</div>
                    <div><b>Diagnóstico:</b> {r.diagnosis ?? '—'}</div>
                    <div><b>Prescrição:</b> {r.prescription ?? '—'}</div>
                    <div className="muted"><b>Obs:</b> {r.observations ?? '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exames (placeholder bonito - vamos implementar depois) */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Exames</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Em breve: anexos de exames, pedidos e resultados (sem upload por agora, podemos usar links).
          </div>
        </div>
      </div>
    </div>
  )
}
