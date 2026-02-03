'use client'

import React from 'react'
import { useToast } from '@/components/toast/ToastProvider'

type RecordItem = {
  id: string
  createdAt: string
  complaint?: string | null
  diagnosis?: string | null
  prescription?: string | null
  observations?: string | null
}

type ExamItem = {
  id: string
  createdAt: string
  filename: string
  url: string
  contentType: string
}

type Props = {
  patientId: string
  initialRecords: RecordItem[]
  initialExams: ExamItem[]
}

export default function RecordsAndExamsClient({ patientId, initialRecords, initialExams }: Props) {
  const toastApi = useToast()
  const [records, setRecords] = React.useState<RecordItem[]>(initialRecords)
  const [exams, setExams] = React.useState<ExamItem[]>(initialExams)
  const [loading, setLoading] = React.useState(false)

  // novo registro
  const [complaint, setComplaint] = React.useState('')
  const [diagnosis, setDiagnosis] = React.useState('')
  const [prescription, setPrescription] = React.useState('')
  const [observations, setObservations] = React.useState('')

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${patientId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao atualizar dados do paciente')
      const data = await res.json()
      setRecords(data.records ?? [])
      setExams(data.exams ?? [])
    } catch (e: any) {
      toastApi.toast({
        type: 'error',
        title: 'Erro',
        message: e?.message || 'Não foi possível atualizar.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function addRecord() {
    if (!complaint && !diagnosis && !prescription && !observations) {
      toastApi.toast({
        type: 'info',
        title: 'Nada para salvar',
        message: 'Preencha ao menos um campo do registro clínico.',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint, diagnosis, prescription, observations }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Erro ao criar registro')

      toastApi.toast({ type: 'success', title: 'Registro criado', message: 'Salvo com sucesso.' })
      setComplaint('')
      setDiagnosis('')
      setPrescription('')
      setObservations('')
      await refresh()
    } catch (e: any) {
      toastApi.toast({ type: 'error', title: 'Erro', message: e?.message || 'Não foi possível criar.' })
    } finally {
      setLoading(false)
    }
  }

  async function uploadExam(file: File) {
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch(`/api/patients/${patientId}/exams`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Erro ao enviar exame')

      toastApi.toast({ type: 'success', title: 'Arquivo enviado', message: 'Exame anexado com sucesso.' })
      await refresh()
    } catch (e: any) {
      toastApi.toast({ type: 'error', title: 'Erro', message: e?.message || 'Não foi possível anexar.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* Registros */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Registros clínicos</div>
            <div className="muted" style={{ marginTop: 4 }}>
              Crie registros do atendimento (queixa, diagnóstico, prescrição e observações).
            </div>
          </div>

          <button className="btn" onClick={refresh} disabled={loading}>
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Queixa principal</div>
              <textarea
                className="input"
                style={{ minHeight: 90, resize: 'vertical' }}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Ex.: dor, febre, retorno, etc."
              />
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Diagnóstico</div>
              <textarea
                className="input"
                style={{ minHeight: 90, resize: 'vertical' }}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Ex.: suspeita de..., CID, etc."
              />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Prescrição</div>
              <textarea
                className="input"
                style={{ minHeight: 90, resize: 'vertical' }}
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Ex.: medicamentos, posologia, etc."
              />
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Observações</div>
              <textarea
                className="input"
                style={{ minHeight: 90, resize: 'vertical' }}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex.: orientações, retorno, anotações..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btnPrimary" onClick={addRecord} disabled={loading}>
              + Novo registro
            </button>
          </div>

          <div style={{ marginTop: 6 }}>
            {records.length === 0 ? (
              <div className="muted">Nenhum registro clínico ainda.</div>
            ) : (
              <div className="grid" style={{ gap: 10 }}>
                {records.map((r) => (
                  <div key={r.id} className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontWeight: 800 }}>Registro</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {new Date(r.createdAt).toLocaleString('pt-BR')}
                    </div>

                    <div style={{ marginTop: 10, lineHeight: 1.4 }}>
                      {r.complaint ? <div><b>Queixa:</b> {r.complaint}</div> : null}
                      {r.diagnosis ? <div><b>Diagnóstico:</b> {r.diagnosis}</div> : null}
                      {r.prescription ? <div><b>Prescrição:</b> {r.prescription}</div> : null}
                      {r.observations ? <div><b>Obs.:</b> {r.observations}</div> : null}

                      {!r.complaint && !r.diagnosis && !r.prescription && !r.observations ? (
                        <div className="muted">Sem conteúdo.</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exames */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Exames e anexos</div>
            <div className="muted" style={{ marginTop: 4 }}>
              Envie PDF/JPG/PNG (e depois vamos transformar Word/TXT → PDF automaticamente).
            </div>
          </div>

          <label className="btn" style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            + Anexar exame
            <input
              type="file"
              hidden
              disabled={loading}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                uploadExam(f)
                e.currentTarget.value = ''
              }}
            />
          </label>
        </div>

        <div style={{ marginTop: 14 }}>
          {exams.length === 0 ? (
            <div className="muted">Nenhum exame anexado ainda.</div>
          ) : (
            <div className="grid" style={{ gap: 10 }}>
              {exams.map((ex) => (
                <div key={ex.id} className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{ex.filename}</div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {new Date(ex.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <a className="btn" href={ex.url} target="_blank" rel="noreferrer">
                      Abrir
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
