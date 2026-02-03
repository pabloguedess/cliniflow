'use client'

import React, { useMemo, useState } from 'react'
import { toast } from '@/components/Toast'

type RecordItem = {
  id: string
  createdAt: string | Date
  complaint?: string | null
  diagnosis?: string | null
  prescription?: string | null
  observations?: string | null
}

type ExamItem = {
  id: string
  createdAt: string | Date
  filename: string
  url: string | null
  contentType: string
  path?: string
}

function fmtDate(v: string | Date) {
  const d = typeof v === 'string' ? new Date(v) : v
  return d.toLocaleString('pt-BR')
}

export default function RecordsAndExamsClient({
  patientId,
  initialRecords,
  initialExams,
}: {
  patientId: string
  initialRecords: RecordItem[]
  initialExams: ExamItem[]
}) {
  const [tab, setTab] = useState<'records' | 'exams'>('records')
  const [records, setRecords] = useState<RecordItem[]>(initialRecords ?? [])
  const [exams, setExams] = useState<ExamItem[]>(initialExams ?? [])

  // novo registro
  const [openRecord, setOpenRecord] = useState(false)
  const [complaint, setComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [prescription, setPrescription] = useState('')
  const [observations, setObservations] = useState('')
  const [savingRecord, setSavingRecord] = useState(false)

  // upload
  const [uploading, setUploading] = useState(false)

  const totalRecords = useMemo(() => records.length, [records])
  const totalExams = useMemo(() => exams.length, [exams])

  async function refreshRecords() {
    const res = await fetch(`/api/patients/${patientId}/records`, { cache: 'no-store' })
    const data = await res.json().catch(() => null)
    if (!res.ok) return
    setRecords(data?.records ?? [])
  }

  async function refreshExams() {
    const res = await fetch(`/api/patients/${patientId}/exams`, { cache: 'no-store' })
    const data = await res.json().catch(() => null)
    if (!res.ok) return
    setExams(data?.exams ?? [])
  }

  async function createRecord() {
    setSavingRecord(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint,
          diagnosis,
          prescription,
          observations,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.message ?? 'Erro ao criar registro')
        return
      }

      toast.success('Registro adicionado com sucesso')
      setComplaint('')
      setDiagnosis('')
      setPrescription('')
      setObservations('')
      setOpenRecord(false)
      await refreshRecords()
      setTab('records')
    } catch (e) {
      console.error(e)
      toast.error('Falha ao criar registro')
    } finally {
      setSavingRecord(false)
    }
  }

  async function uploadExam(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch(`/api/patients/${patientId}/exams`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.message ?? 'Erro ao anexar')
        return
      }

      toast.success('Arquivo anexado com sucesso')
      await refreshExams()
      setTab('exams')
    } catch (e) {
      console.error(e)
      toast.error('Falha no upload')
    } finally {
      setUploading(false)
    }
  }

  function onPickFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return

    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]

    // OBS: .doc (msword) hoje retorna erro no backend, mas deixo aqui pra mostrar msg amigável
    if (!allowed.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado')
      ev.target.value = ''
      return
    }

    uploadExam(file)
    ev.target.value = ''
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Registros e anexos</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            {totalRecords} registros • {totalExams} anexos
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setTab('records')} aria-pressed={tab === 'records'}>
            Registros
          </button>
          <button className="btn" onClick={() => setTab('exams')} aria-pressed={tab === 'exams'}>
            Anexos
          </button>

          <button className="btn btnPrimary" onClick={() => setOpenRecord(true)}>
            + Novo registro
          </button>

          <label
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? 'Enviando...' : '+ Anexar exame'}
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,application/pdf,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={onPickFile}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Modal Novo Registro */}
      {openRecord ? (
        <div style={{ marginTop: 14 }} className="card">
          <div style={{ padding: 14 }}>
            <div style={{ fontWeight: 900 }}>Novo registro</div>
            <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
              Preencha o que for necessário (pode deixar campos vazios).
            </div>

            <div className="grid" style={{ marginTop: 12 }}>
              <input className="input" placeholder="Queixa principal" value={complaint} onChange={(e) => setComplaint(e.target.value)} />
              <input className="input" placeholder="Diagnóstico" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              <input className="input" placeholder="Prescrição" value={prescription} onChange={(e) => setPrescription(e.target.value)} />
              <textarea
                className="input"
                placeholder="Observações"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                style={{ minHeight: 90, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => setOpenRecord(false)} disabled={savingRecord}>
                Cancelar
              </button>
              <button className="btn btnPrimary" onClick={createRecord} disabled={savingRecord}>
                {savingRecord ? 'Salvando...' : 'Salvar registro'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Conteúdo */}
      <div style={{ marginTop: 14 }}>
        {tab === 'records' ? (
          <div className="grid" style={{ gap: 10 }}>
            {records.length === 0 ? (
              <div className="muted">Nenhum registro ainda.</div>
            ) : (
              records.map((r) => (
                <div key={r.id} className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 900 }}>Registro</div>
                    <div className="muted" style={{ fontSize: 12 }}>{fmtDate(r.createdAt)}</div>
                  </div>

                  <div style={{ marginTop: 10, lineHeight: 1.5 }}>
                    {r.complaint ? <div><b>Queixa:</b> {r.complaint}</div> : null}
                    {r.diagnosis ? <div><b>Diagnóstico:</b> {r.diagnosis}</div> : null}
                    {r.prescription ? <div><b>Prescrição:</b> {r.prescription}</div> : null}
                    {r.observations ? <div><b>Obs:</b> {r.observations}</div> : null}

                    {!r.complaint && !r.diagnosis && !r.prescription && !r.observations ? (
                      <div className="muted">Registro vazio.</div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            {exams.length === 0 ? (
              <div className="muted">Nenhum anexo ainda.</div>
            ) : (
              exams.map((x) => (
                <div key={x.id} className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 900 }}>{x.filename}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{fmtDate(x.createdAt)}</div>
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {x.url ? (
                      <a className="btn" href={x.url} target="_blank" rel="noreferrer">
                        Abrir
                      </a>
                    ) : (
                      <span className="muted">Gerando link...</span>
                    )}

                    <div className="muted" style={{ fontSize: 12 }}>
                      {x.contentType}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
