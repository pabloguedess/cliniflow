import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import PatientSearchSelect from '@/components/PatientSearchSelect'

type SP = { patientId?: string }

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)
  if (!session) return <div className="container">Não autorizado</div>

  const lockedPatientId = (sp.patientId || '').trim()

  const lockedPatient = lockedPatientId
    ? await prisma.patient.findFirst({
        where: { id: lockedPatientId, tenantId: session.tenantId, active: true },
        select: { id: true, name: true },
      })
    : null

  // ✅ Tipos existentes (sem precisar você me falar quais são)
  const typeRows = await prisma.appointment.findMany({
    where: { tenantId: session.tenantId },
    distinct: ['type'],
    select: { type: true },
    take: 50,
  })

  const existingTypes = typeRows
    .map((x) => (x.type || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const fallbackTypes = ['Consulta', 'Exame']
  const types = existingTypes.length ? existingTypes : fallbackTypes

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card" style={{ padding: 18 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Novo agendamento</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Criar agendamento com paciente + data/hora + tipo.
            </div>
          </div>

          <Link className="btn" href="/appointments">
            Voltar
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <form className="grid" style={{ gap: 12 }} action="/api/appointments" method="post">
          <input type="hidden" name="lockedPatient" value={lockedPatient ? '1' : '0'} />

          {/* ✅ Paciente */}
          <div className="grid" style={{ gap: 8 }}>
            <div style={{ fontWeight: 800 }}>Paciente</div>

            {lockedPatient ? (
              <>
                <input type="hidden" name="patientId" value={lockedPatient.id} />
                <div className="input" style={{ display: 'flex', alignItems: 'center' }}>
                  {lockedPatient.name}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Agendamento iniciado pelo paciente (travado).
                </div>
              </>
            ) : (
              <>
                <PatientSearchSelect />
                <div className="muted" style={{ fontSize: 12 }}>
                  Digite o nome e selecione um paciente sugerido.
                </div>
              </>
            )}
          </div>

          {/* ✅ Data/Hora */}
          <div className="grid" style={{ gap: 8 }}>
            <div style={{ fontWeight: 800 }}>Data e hora</div>
            <input className="input" name="date" type="datetime-local" required />
          </div>

          {/* ✅ Tipo (dropdown bonito) */}
          <div className="grid" style={{ gap: 8 }}>
            <div style={{ fontWeight: 800 }}>Tipo</div>
            <select className="input" name="type" required defaultValue="">
              <option value="" disabled>
                Selecione o tipo
              </option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="muted" style={{ fontSize: 12 }}>
              Esses tipos são puxados do que já existe no seu sistema.
            </div>
          </div>

          {/* ✅ Observações */}
          <div className="grid" style={{ gap: 8 }}>
            <div style={{ fontWeight: 800 }}>Observações (opcional)</div>
            <textarea className="input" name="notes" style={{ minHeight: 90, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Link className="btn" href="/appointments">
              Cancelar
            </Link>
            <button className="btn btnPrimary" type="submit">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
