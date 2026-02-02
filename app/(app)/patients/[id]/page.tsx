import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { RecordsAndExamsClient } from '@/components/RecordsAndExamsClient'
import { ToastProvider } from '@/components/Toast'

export const dynamic = 'force-dynamic'

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)
  if (!session) return <div className="container">Não autorizado</div>

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
          <div style={{ fontWeight: 900, fontSize: 20 }}>Paciente não encontrado</div>
          <div className="muted" style={{ marginTop: 8 }}>Verifique o link e tente novamente.</div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/patients">Voltar</Link>
          </div>
        </div>
      </div>
    )
  }

  const birth = patient.birthDate ? new Intl.DateTimeFormat('pt-BR').format(new Date(patient.birthDate)) : '—'

  return (
    <ToastProvider>
      <div style={{ paddingTop: 18 }}>
        <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{patient.name}</div>
            <div className="muted" style={{ marginTop: 6 }}>ID: {patient.id}</div>
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
            <div className="card" style={{ padding: 16 }}>
              <div className="muted" style={{ fontSize: 13 }}>Contato</div>
              <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                <div><b>Telefone:</b> {patient.phone || '—'}</div>
                <div><b>Email:</b> {patient.email || '—'}</div>
                <div><b>Endereço:</b> {patient.address || '—'}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div className="muted" style={{ fontSize: 13 }}>Documentos</div>
              <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                <div><b>CPF:</b> {patient.cpf || '—'}</div>
                <div><b>RG:</b> {patient.rg || '—'}</div>
                <div><b>Nascimento:</b> {birth}</div>
                <div><b>Gênero:</b> {patient.gender || '—'}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 13 }}>Observações</div>
            <div style={{ marginTop: 10 }}>{patient.notes || '—'}</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {/* Botões + Novo registro / + Anexar exame ficam aqui */}
          <RecordsAndExamsClient patientId={patient.id} />
        </div>
      </div>
    </ToastProvider>
  )
}
