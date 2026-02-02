import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export default async function PatientRecordsPage({
  params,
}: {
  params: Params | Promise<Params>
}) {
  const p = await Promise.resolve(params)
  const patientId = p?.id

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

  if (!patientId || patientId === 'undefined') {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Paciente inválido</div>
          <div className="muted" style={{ marginTop: 6 }}>
            O ID do paciente não foi recebido corretamente.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/patients">Voltar</Link>
          </div>
        </div>
      </div>
    )
  }

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

  // (por enquanto lista vazia - próximo passo criaremos registros)
  const records: any[] = []

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
          <div style={{ fontWeight: 900, fontSize: 22 }}>Prontuário</div>
          <div className="muted" style={{ marginTop: 6 }}>Paciente: <b>{patient.name}</b></div>
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

        <div style={{ marginTop: 12 }}>
          {records.length === 0 ? (
            <div className="muted">Nenhum registro clínico ainda.</div>
          ) : (
            <div>...</div>
          )}
        </div>
      </div>
    </div>
  )
}
