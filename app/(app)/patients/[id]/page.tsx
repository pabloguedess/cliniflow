import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import RecordsAndExamsClient from '@/components/RecordsAndExamsClient'

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
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          Não autorizado
        </div>
      </div>
    )
  }

  const patient = await prisma.patient.findFirst({
    where: { id, tenantId: session.tenantId },
  })

  if (!patient) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Paciente não encontrado</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Volte para a lista e tente abrir novamente.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Link className="btn" href="/patients">Voltar para pacientes</Link>
            <a className="btn" href={`/patients/${id}`}>Recarregar</a>
          </div>
        </div>
      </div>
    )
  }

  // Carrega registros + exames do paciente certo (por patientId)
  const records = await prisma.medicalRecord.findMany({
    where: { tenantId: session.tenantId, patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      complaint: true,
      diagnosis: true,
      prescription: true,
      observations: true,
    },
  })

  // se você ainda não tem tabela de exams no prisma, deixe como []
  // (quando você tiver, só trocar a query)
  const exams = await prisma.exam.findMany({
    where: { tenantId: session.tenantId, patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      filename: true,
      url: true,
      contentType: true,
    },
  }).catch(() => [])

  const addressText =
    patient.address
      ? patient.address
      : '—'

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{patient.name}</div>
            <div className="muted" style={{ marginTop: 6 }}>ID: {patient.id}</div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link className="btn" href="/patients">Voltar</Link>

            <Link className="btn" href={`/patients/${patient.id}/edit`}>
              Editar ficha
            </Link>

            <Link className="btn" href={`/appointments/new?patientId=${patient.id}`}>
              Agendar
            </Link>
          </div>
        </div>
      </div>

      {/* Ficha */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Ficha</div>

        <div className="grid" style={{ marginTop: 12, gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.04)' }}>
            <div className="muted" style={{ fontSize: 12 }}>Contato</div>
            <div style={{ marginTop: 8, lineHeight: 1.5 }}>
              <div><b>Telefone:</b> {patient.phone || '—'}</div>
              <div><b>Email:</b> {patient.email || '—'}</div>
              <div><b>Endereço:</b> {addressText}</div>
            </div>
          </div>

          <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.04)' }}>
            <div className="muted" style={{ fontSize: 12 }}>Documentos</div>
            <div style={{ marginTop: 8, lineHeight: 1.5 }}>
              <div><b>CPF:</b> {patient.cpf || '—'}</div>
              <div><b>RG:</b> {patient.rg || '—'}</div>
              <div><b>Nascimento:</b> {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : '—'}</div>
              <div><b>Gênero:</b> {patient.gender || '—'}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 14, marginTop: 12, background: 'rgba(255,255,255,0.04)' }}>
          <div className="muted" style={{ fontSize: 12 }}>Observações</div>
          <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
            {patient.notes || '—'}
          </div>
        </div>
      </div>

      {/* ✅ Registros + Anexos */}
      <RecordsAndExamsClient
        patientId={patient.id}
        initialRecords={records as any}
        initialExams={exams as any}
      />
    </div>
  )
}
