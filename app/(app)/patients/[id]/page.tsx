import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import RecordsAndExamsClient from '@/components/RecordsAndExamsClient'

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Não autorizado</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Faça login novamente.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/login">Ir para login</Link>
          </div>
        </div>
      </div>
    )
  }

  const patient = await prisma.patient.findFirst({
    where: { id, tenantId: session.tenantId, active: true },
  })

  if (!patient) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Paciente não encontrado</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Talvez ele tenha sido excluído.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/patients">Voltar</Link>
          </div>
        </div>
      </div>
    )
  }

  const records = await prisma.medicalRecord.findMany({
    where: { tenantId: session.tenantId, patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const exams = await prisma.exam.findMany({
    where: { tenantId: session.tenantId, patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{patient.name}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              {patient.phone ? `Telefone: ${patient.phone}` : 'Sem telefone'} • {patient.email ? `Email: ${patient.email}` : 'Sem email'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link className="btn" href="/patients">Voltar</Link>
            <Link className="btn btnPrimary" href={`/patients/${patient.id}/edit`}>Editar</Link>
            <Link className="btn" href={`/appointments/new?patientId=${patient.id}`}>Agendar</Link>
          </div>
        </div>

        <div className="grid" style={{ marginTop: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
            <div style={{ fontWeight: 900 }}>CPF</div>
            <div className="muted" style={{ marginTop: 4 }}>{patient.cpf || '—'}</div>
          </div>
          <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
            <div style={{ fontWeight: 900 }}>RG</div>
            <div className="muted" style={{ marginTop: 4 }}>{patient.rg || '—'}</div>
          </div>
          <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
            <div style={{ fontWeight: 900 }}>Nascimento</div>
            <div className="muted" style={{ marginTop: 4 }}>
              {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : '—'}
            </div>
          </div>
          <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
            <div style={{ fontWeight: 900 }}>Endereço</div>
            <div className="muted" style={{ marginTop: 4 }}>{patient.address || '—'}</div>
          </div>
        </div>

        {patient.notes ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 900 }}>Observações</div>
            <div className="muted" style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{patient.notes}</div>
          </div>
        ) : null}
      </div>

      <RecordsAndExamsClient
        patientId={patient.id}
        initialRecords={records.map((r) => ({
          id: r.id,
          createdAt: r.createdAt,
          complaint: r.complaint,
          diagnosis: r.diagnosis,
          prescription: r.prescription,
          observations: r.observations,
        }))}
        initialExams={exams.map((e) => ({
          id: e.id,
          createdAt: e.createdAt,
          filename: e.filename,
          url: '', // a URL real vem via GET do endpoint (signed url). A lista atualiza quando você anexar/atualizar.
          contentType: e.contentType,
        }))}
      />
    </div>
  )
}
