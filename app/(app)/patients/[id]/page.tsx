'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from '@/components/Toast'

type Patient = {
  id: string
  name: string
  phone: string | null
  email: string | null
  cpf: string | null
  rg: string | null
  birthDate: string | null
  gender: string | null
  address: string | null
  notes: string | null
}

export default function PatientDetailsPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<Patient | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('not ok')
      const data = await res.json()
      setPatient(data.patient)
    } catch {
      setPatient(null)
      toast.error('Erro ao carregar', 'Não foi possível carregar o paciente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onDelete() {
    if (!patient) return
    const ok = confirm(`Tem certeza que deseja excluir o paciente "${patient.name}"?`)
    if (!ok) return

    try {
      const res = await fetch(`/api/patients/${patient.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      toast.success('Excluído', 'Paciente removido com sucesso.')
      router.push('/patients')
      router.refresh()
    } catch {
      toast.error('Erro', 'Não foi possível excluir o paciente.')
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Carregando...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Paciente não encontrado</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Volte para a lista e tente abrir novamente.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="btn" onClick={() => router.push('/patients')}>Voltar para pacientes</button>
          <button className="btn" onClick={() => load()}>Recarregar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>{patient.name}</div>
          <div className="muted" style={{ marginTop: 4 }}>ID: {patient.id}</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => router.push('/patients')}>Voltar</button>
          <button className="btn" onClick={() => router.push(`/appointments/new?patientId=${patient.id}`)}>Agendar</button>
          <button className="btn" style={{ borderColor: 'rgba(255,90,90,.35)' }} onClick={onDelete}>
            Excluir paciente
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>Ficha</div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ padding: 14, boxShadow: 'none' }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Contato</div>
            <div><b>Telefone:</b> {patient.phone || '—'}</div>
            <div><b>Email:</b> {patient.email || '—'}</div>
            <div><b>Endereço:</b> {patient.address || '—'}</div>
          </div>

          <div className="card" style={{ padding: 14, boxShadow: 'none' }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Documentos</div>
            <div><b>CPF:</b> {patient.cpf || '—'}</div>
            <div><b>RG:</b> {patient.rg || '—'}</div>
            <div><b>Nascimento:</b> {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : '—'}</div>
            <div><b>Gênero:</b> {patient.gender || '—'}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 14, boxShadow: 'none', marginTop: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Observações</div>
          <div>{patient.notes || '—'}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Registros e anexos</div>
        <div className="muted" style={{ marginTop: 6 }}>
          (Aqui ficam os registros clínicos e anexos do paciente. Próximo passo: + Novo registro e + Anexar exame.)
        </div>
      </div>
    </div>
  )
}
