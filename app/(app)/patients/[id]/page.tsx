import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { DeletePatientButton } from '@/components/DeletePatientButton'

export const dynamic = 'force-dynamic'

export default async function PatientDetailsPage({
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

  if (!id) {
    return (
      <div className="container" style={{ paddingTop: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          ID inválido.
          <div style={{ marginTop: 10 }}>
            <Link className="btn" href="/patients">
              Voltar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const patient = await prisma.patient.findFirst({
    where: { id, tenantId: session.tenantId, active: true },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      cpf: true,
      rg: true,
      birthDate: true,
      gender: true,
      notes: true,
    },
  })

  if (!patient) {
    return (
      <div className="container" style={{ paddingTop: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          Paciente não encontrado.
          <div style={{ marginTop: 10 }}>
            <Link className="btn" href="/patients">
              Voltar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const birth = patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : '—'

  return (
    <div style={{ paddingTop: 18 }}>
      <div
        className="card"
        style={{
          padding: 18,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
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
          <Link className="btn" href="/patients">
            Voltar
          </Link>

          <Link className="btn" href={`/patients/${patient.id}/records`}>
            Prontuário
          </Link>

          <Link className="btn" href={`/appointments/new?patientId=${patient.id}`}>
            Agendar
          </Link>

          <DeletePatientButton patientId={patient.id} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 18 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Ficha</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Contato
            </div>
            <div>
              <b>Telefone:</b> {patient.phone || '—'}
            </div>
            <div>
              <b>Email:</b> {patient.email || '—'}
            </div>
            <div>
              <b>Endereço:</b> {patient.address || '—'}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Documentos
            </div>
            <div>
              <b>CPF:</b> {patient.cpf || '—'}
            </div>
            <div>
              <b>RG:</b> {patient.rg || '—'}
            </div>
            <div>
              <b>Nascimento:</b> {birth}
            </div>
            <div>
              <b>Gênero:</b> {patient.gender || '—'}
            </div>
          </div>

          <div className="card" style={{ padding: 14, gridColumn: '1 / -1' }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Observações
            </div>
            <div>{patient.notes || '—'}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 18 }}>
        <div style={{ fontWeight: 900 }}>Exames</div>
        <div className="muted" style={{ marginTop: 6 }}>
          (Próximo passo: upload + lista de exames do paciente, com opção de vincular ao prontuário.)
        </div>
      </div>
    </div>
  )
}
