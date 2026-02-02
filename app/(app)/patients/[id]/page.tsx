import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export default async function PatientDetailsPage({ params }: { params: { id: string } }) {
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

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId: session.tenantId },
    select: {
      id: true,
      name: true,
      cpf: true,
      rg: true,
      birthDate: true,
      gender: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      createdAt: true,
    },
  })

  if (!patient) {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Paciente não encontrado</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Esse paciente não existe ou não pertence à sua clínica.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/patients">Voltar</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 18 }}>
      <div
        className="card"
        style={{
          padding: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>{patient.name}</div>
          <div className="muted" style={{ marginTop: 6 }}>
            ID: {patient.id}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn" href="/patients">Voltar</Link>
          <Link className="btn" href={`/patients/${patient.id}/records`}>Prontuário</Link>
          <Link className="btn" href={`/appointments/new?patientId=${patient.id}`}>Agendar</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Ficha</div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="muted" style={{ fontSize: 12 }}>Contato</div>
            <div style={{ marginTop: 8 }}><b>Telefone:</b> {patient.phone ?? '—'}</div>
            <div><b>Email:</b> {patient.email ?? '—'}</div>
            <div><b>Endereço:</b> {patient.address ?? '—'}</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="muted" style={{ fontSize: 12 }}>Documentos</div>
            <div style={{ marginTop: 8 }}><b>CPF:</b> {patient.cpf ?? '—'}</div>
            <div><b>RG:</b> {patient.rg ?? '—'}</div>
            <div><b>Nascimento:</b> {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : '—'}</div>
            <div><b>Gênero:</b> {patient.gender ?? '—'}</div>
          </div>

          <div className="card" style={{ padding: 14, gridColumn: '1 / span 2' }}>
            <div className="muted" style={{ fontSize: 12 }}>Observações</div>
            <div style={{ marginTop: 8 }}>{patient.notes ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Exames</div>
        <div className="muted" style={{ marginTop: 6 }}>
          (Próximo passo: upload + lista de exames do paciente, com opção de vincular ao prontuário.)
        </div>
      </div>
    </div>
  )
}
