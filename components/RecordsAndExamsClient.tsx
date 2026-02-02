'use client'

import React from 'react'
import { useToast } from '@/components/Toast'

type RecordItem = {
  id: string
  complaint?: string | null
  diagnosis?: string | null
  prescription?: string | null
  observations?: string | null
  createdAt: string
}

type ExamItem = {
  name: string
  path: string
  url: string | null
  createdAt?: string | null
  size?: number | null
}

function formatDT(d: string) {
  const dd = new Date(d)
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(dd)
}

export function RecordsAndExamsClient({ patientId }: { patientId: string }) {
  const { push } = useToast()
  const [loading, setLoading] = React.useState(false)

  const [records, setRecords] = React.useState<RecordItem[]>([])
  const [exams, setExams] = React.useState<ExamItem[]>([])

  const [openRecord, setOpenRecord] = React.useState(false)
  const [openExam, setOpenExam] = React.useState(false)

  const [complaint, setComplaint] = React.useState('')
  const [diagnosis, setDiagnosis] = React.useState('')
  const [prescription, setPrescription] = React.useState('')
  const [observations, setObservations] = React.useState('')

  const [examTitle, setExamTitle] = React.useState('')
  const [examFile, setExamFile] = React.useState<File | null>(null)

  async function refreshAll() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/patients/${patientId}/records`, { cache: 'no-store' }).then((r) => r.json()),
        fetch(`/api/patients/${patientId}/exams`, { cache: 'no-store' }).then((r) => r.json()),
      ])
      setRecords(Array.isArray(r1.items) ? r1.items : [])
      setExams(Array.isArray(r2.items) ? r2.items : [])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  async function createRecord() {
    try {
      setLoading(true)
      const res = await fetch(`/api/patients/${patientId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint, diagnosis, prescription, observations }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Erro ao criar registro')

      setOpenRecord(false)
      setComplaint('')
      setDiagnosis('')
      setPrescription('')
      setObservations('')
      push({ variant: 'success', title: 'Registro criado', description: 'Prontuário atualizado com sucesso.' })
      await refreshAll()
    } catch (e: any) {
      push({ variant: 'error', title: 'Não foi possível criar', description: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function uploadExam() {
    try {
      if (!examFile) {
        push({ variant: 'error', title: 'Selecione um arquivo', description: 'Escolha o PDF/Imagem do exame.' })
        return
      }

      setLoading(true)
      const form = new FormData()
      form.append('title', examTitle || 'exame')
      form.append('file', examFile)

      const res = await fetch(`/api/patients/${patientId}/exams`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Erro ao enviar exame')

      setOpenExam(false)
      setExamTitle('')
      setExamFile(null)
      push({ variant: 'success', title: 'Exame anexado', description: 'Upload concluído.' })
      await refreshAll()
    } catch (e: any) {
      push({ variant: 'error', title: 'Erro ao anexar exame', description: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900 }}>Prontuário</div>
          <div className="muted" style={{ marginTop: 6 }}>
            {loading ? 'Atualizando…' : `${records.length} registro(s) • ${exams.length} exame(s)`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" type="button" onClick={() => setOpenRecord(true)}>+ Novo registro</button>
          <button className="btn" type="button" onClick={() => setOpenExam(true)}>+ Anexar exame</button>
          <button className="btn" type="button" onClick={refreshAll}>Atualizar</button>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900 }}>Registros clínicos</div>
        <div className="muted" style={{ marginTop: 6 }}>Consulta, evolução, prescrição e observações.</div>

        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {records.length === 0 ? (
            <div className="muted">Nenhum registro ainda.</div>
          ) : (
            records.map((r) => (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 900 }}>Registro</div>
                  <div className="muted">{formatDT(r.createdAt)}</div>
                </div>

                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  <div><b>Queixa:</b> {r.complaint || '—'}</div>
                  <div><b>Diagnóstico:</b> {r.diagnosis || '—'}</div>
                  <div><b>Prescrição:</b> {r.prescription || '—'}</div>
                  <div><b>Obs:</b> {r.observations || '—'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900 }}>Exames anexados</div>
        <div className="muted" style={{ marginTop: 6 }}>Upload via Supabase Storage (links assinados).</div>

        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {exams.length === 0 ? (
            <div className="muted">Nenhum exame anexado.</div>
          ) : (
            exams.map((e) => (
              <div key={e.path} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{e.name}</div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    {e.createdAt ? `Enviado em ${e.createdAt}` : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {e.url ? (
                    <a className="btn" href={e.url} target="_blank" rel="noreferrer">Abrir</a>
                  ) : (
                    <span className="muted">Sem link</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: NOVO REGISTRO */}
      {openRecord ? (
        <div
          onClick={() => setOpenRecord(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.55)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 9998,
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ padding: 18, width: 'min(900px, 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Novo registro</div>
              <button className="btn" type="button" onClick={() => setOpenRecord(false)}>Fechar</button>
            </div>

            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <input className="input" placeholder="Queixa principal" value={complaint} onChange={(e) => setComplaint(e.target.value)} />
              <input className="input" placeholder="Diagnóstico" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              <input className="input" placeholder="Prescrição" value={prescription} onChange={(e) => setPrescription(e.target.value)} />
              <textarea className="input" placeholder="Observações" value={observations} onChange={(e) => setObservations(e.target.value)} style={{ minHeight: 110 }} />
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn" type="button" onClick={() => setOpenRecord(false)}>Cancelar</button>
              <button className="btn" type="button" onClick={createRecord} disabled={loading}>
                {loading ? 'Salvando…' : 'Salvar registro'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: ANEXAR EXAME */}
      {openExam ? (
        <div
          onClick={() => setOpenExam(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.55)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 9998,
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ padding: 18, width: 'min(820px, 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Anexar exame</div>
              <button className="btn" type="button" onClick={() => setOpenExam(false)}>Fechar</button>
            </div>

            <div className="muted" style={{ marginTop: 10 }}>
              Envie PDF/JPG/PNG. Depois a gente vincula ao registro clínico.
            </div>

            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <input className="input" placeholder="Título (ex: Hemograma)" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
              <input
                className="input"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setExamFile(e.target.files?.[0] || null)}
              />
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn" type="button" onClick={() => setOpenExam(false)}>Cancelar</button>
              <button className="btn" type="button" onClick={uploadExam} disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar exame'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
