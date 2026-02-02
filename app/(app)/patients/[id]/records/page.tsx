import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export default async function PatientRecordsPage({
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

  // ✅ SEMPRE busca pelo params.id + tenantId (nunca pega "primeiro paciente")
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId: session.tenantId },
    select: { id: true, name: true },
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

  const records = await prisma.medicalRecord.findMany({
    where: { tenantId: session.tenantId, patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      complaint: true,
      diagnosis: true,
      prescription: true,
      observations: true,
    },
  })

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
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Prontuário</div>
          <div className="muted" style={{ marginTop: 4 }}>
            Paciente: <b>{patient.name}</b>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn" href={`/patients/${patient.id}`}>Voltar para o paciente</Link>
          <Link className="btn" href="/patients">Pacientes</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Registros clínicos</div>
        <div className="muted" style={{ marginTop: 6 }}>
          (No próximo passo vamos criar “+ Novo registro” e “+ Anexar exame”.)
        </div>

        {records.length === 0 ? (
          <div style={{ marginTop: 12 }} className="muted">
            Nenhum registro clínico ainda.
          </div>
        ) : (
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {records.map((r) => (
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
    </div>
  )
}
