'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type Patient = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  cpf?: string | null
  rg?: string | null
  birthDate?: string | null
  gender?: string | null
  notes?: string | null
  createdAt?: string | null
}

type ToastKind = 'success' | 'error' | 'info'
type ToastItem = { id: string; kind: ToastKind; title: string; message?: string }

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function formatDateBR(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

function labelOrDash(v?: string | null) {
  const s = (v ?? '').trim()
  return s ? s : '—'
}

export default function PatientDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const patientId = useMemo(() => (params?.id ? String(params.id) : ''), [params])

  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [tab, setTab] = useState<'ficha' | 'registros' | 'anexos'>('ficha')

  // toasts locais (popup canto inferior direito)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = (kind: ToastKind, title: string, message?: string) => {
    const id = uid()
    setToasts((prev) => [{ id, kind, title, message }, ...prev].slice(0, 4))
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }

  async function loadPatient() {
    if (!patientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${patientId}`, { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Não foi possível carregar o paciente.')
      }
      const data = await res.json()
      setPatient(data?.patient ?? data)
    } catch (err: any) {
      setPatient(null)
      pushToast('error', 'Erro ao carregar', err?.message || 'Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  async function handleDelete() {
    if (!patient) return

    const ok = window.confirm(
      `Tem certeza que deseja excluir o paciente "${patient.name}"?\n\nEssa ação não pode ser desfeita.`
    )
    if (!ok) return

    try {
      const res = await fetch(`/api/patients/${patient.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.message || 'Erro ao excluir paciente.')

      pushToast('success', 'Paciente excluído', 'O paciente foi removido com sucesso.')
      // volta para lista
      router.push('/patients')
      router.refresh()
    } catch (err: any) {
      pushToast('error', 'Falha ao excluir', err?.message || 'Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="grid" style={{ gap: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Carregando paciente…</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Aguarde um instante.
          </div>
        </div>

        <ToastViewport toasts={toasts} onClose={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="grid" style={{ gap: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Paciente não encontrado</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Volte para a lista e tente abrir novamente.
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn" href="/patients">
              Voltar para pacientes
            </Link>
            <button className="btn" onClick={loadPatient}>
              Recarregar
            </button>
          </div>
        </div>

        <ToastViewport toasts={toasts} onClose={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      </div>
    )
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* Header */}
      <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 260 }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{patient.name}</div>
          <div className="muted" style={{ marginTop: 2, fontSize: 13 }}>
            ID: {patient.id}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link className="btn" href="/patients">
            Voltar
          </Link>

          {/* Agendar direto para esse paciente */}
          <Link className="btn" href={`/appointments/new?patientId=${encodeURIComponent(patient.id)}`}>
            Agendar
          </Link>

          {/* Removemos o botão "Prontuário" porque agora Registros + Anexos ficam aqui */}
          <button className="btn" onClick={handleDelete} style={{ borderColor: 'rgba(255,90,90,.35)' }}>
            Excluir paciente
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn"
          onClick={() => setTab('ficha')}
          style={tab === 'ficha' ? { background: 'rgba(255,255,255,0.12)' } : undefined}
        >
          Ficha
        </button>
        <button
          className="btn"
          onClick={() => setTab('registros')}
          style={tab === 'registros' ? { background: 'rgba(255,255,255,0.12)' } : undefined}
        >
          Registros
        </button>
        <button
          className="btn"
          onClick={() => setTab('anexos')}
          style={tab === 'anexos' ? { background: 'rgba(255,255,255,0.12)' } : undefined}
        >
          Anexos / Exames
        </button>
      </div>

      {/* Content */}
      {tab === 'ficha' && <Ficha patient={patient} />}
      {tab === 'registros' && (
        <Registros
          patientId={patient.id}
          patientName={patient.name}
          onToast={pushToast}
        />
      )}
      {tab === 'anexos' && (
        <Anexos
          patientId={patient.id}
          patientName={patient.name}
          onToast={pushToast}
        />
      )}

      {/* Toasts */}
      <ToastViewport toasts={toasts} onClose={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  )
}

function Ficha({ patient }: { patient: Patient }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontWeight: 900, fontSize: 16 }}>Ficha</div>
      <div className="muted" style={{ marginTop: 6 }}>
        Dados para contato e identificação do paciente.
      </div>

      <div className="grid" style={{ marginTop: 14, gap: 12 }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Contato</div>
            <div><b>Telefone:</b> {labelOrDash(patient.phone)}</div>
            <div><b>Email:</b> {labelOrDash(patient.email)}</div>
            <div><b>Endereço:</b> {labelOrDash(patient.address)}</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Documentos</div>
            <div><b>CPF:</b> {labelOrDash(patient.cpf)}</div>
            <div><b>RG:</b> {labelOrDash(patient.rg)}</div>
            <div><b>Nascimento:</b> {patient.birthDate ? formatDateBR(patient.birthDate) : '—'}</div>
            <div><b>Gênero:</b> {labelOrDash(patient.gender)}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Observações</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{labelOrDash(patient.notes)}</div>
        </div>
      </div>
    </div>
  )
}

function Registros({
  patientId,
  patientName,
  onToast,
}: {
  patientId: string
  patientName: string
  onToast: (k: ToastKind, t: string, m?: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/records`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message || 'Erro ao carregar registros.')
      setItems(data?.records ?? [])
    } catch (e: any) {
      setItems([])
      onToast('error', 'Erro', e?.message || 'Não foi possível carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  async function handleNew() {
    // Aqui a gente só abre um “stub” por enquanto.
    // No próximo passo você pediu implementar “+ Novo registro” completo.
    setCreating(true)
    try {
      // Se você já tiver endpoint POST, descomente e adapte.
      // const res = await fetch(`/api/patients/${patientId}/records`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ complaint: '', diagnosis: '', prescription: '', observations: '' }),
      // })
      // const data = await res.json().catch(() => null)
      // if (!res.ok) throw new Error(data?.message || 'Erro ao criar registro.')
      // onToast('success', 'Registro criado', 'Agora edite os campos do registro.')
      // await load()

      onToast('info', 'Em breve', 'No próximo passo vamos implementar “+ Novo registro”.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Registros</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Paciente: <b>{patientName}</b>
          </div>
        </div>

        <button className="btn btnPrimary" onClick={handleNew} disabled={creating}>
          + Novo registro
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <div className="muted">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="muted">Nenhum registro clínico ainda.</div>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            {items.map((r) => (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 900 }}>
                  {r.type ? String(r.type) : 'Registro'}{' '}
                  <span className="muted" style={{ fontWeight: 700, fontSize: 12 }}>
                    • {r.createdAt ? formatDateBR(r.createdAt) : ''}
                  </span>
                </div>
                <div className="muted" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>
                  {r.observations || r.content || '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Anexos({
  patientId,
  patientName,
  onToast,
}: {
  patientId: string
  patientName: string
  onToast: (k: ToastKind, t: string, m?: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/exams`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message || 'Erro ao carregar anexos.')
      setFiles(data?.exams ?? data?.files ?? [])
    } catch (e: any) {
      setFiles([])
      onToast('error', 'Erro', e?.message || 'Não foi possível carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // endpoint esperado: POST /api/patients/[id]/exams (multipart/form-data)
      const form = new FormData()
      form.append('file', file)

      const res = await fetch(`/api/patients/${patientId}/exams`, {
        method: 'POST',
        body: form,
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message || 'Erro ao enviar arquivo.')

      onToast('success', 'Arquivo enviado', 'Anexo salvo com sucesso.')
      e.target.value = ''
      await load()
    } catch (err: any) {
      onToast('error', 'Falha no upload', err?.message || 'Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Anexos / Exames</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Paciente: <b>{patientName}</b>
          </div>
        </div>

        <label className="btn btnPrimary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
          {uploading ? 'Enviando…' : '+ Anexar arquivo'}
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            onChange={onPickFile}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
        Aceita PDF, JPG e PNG. (No próximo passo você pediu converter tudo para PDF — vamos fazer isso na API.)
      </div>

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <div className="muted">Carregando…</div>
        ) : files.length === 0 ? (
          <div className="muted">Nenhum anexo ainda.</div>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            {files.map((f) => (
              <div key={f.id ?? f.key ?? f.url} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 240 }}>
                  <div style={{ fontWeight: 900 }}>{f.name ?? f.filename ?? 'Arquivo'}</div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                    {f.createdAt ? formatDateBR(f.createdAt) : ''} {f.type ? `• ${String(f.type)}` : ''}
                  </div>
                </div>

                {f.url ? (
                  <a className="btn" href={f.url} target="_blank" rel="noreferrer">
                    Abrir
                  </a>
                ) : (
                  <div className="muted" style={{ fontSize: 13 }}>Sem link</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions removals">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <div className="toast-dot" />
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.message ? <div className="toast-msg">{t.message}</div> : null}
          </div>
          <button className="toast-x" onClick={() => onClose(t.id)} aria-label="Fechar">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
