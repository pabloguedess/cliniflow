'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useToast } from '@/components/toast/ToastProvider'

type PatientLite = { id: string; name: string }

export default function NewAppointmentForm({
  patients,
  initialPatientId,
}: {
  patients: PatientLite[]
  initialPatientId: string
}) {
  const router = useRouter()
  const { success, error } = useToast()

  const [loading, setLoading] = useState(false)
  const [patientId, setPatientId] = useState(initialPatientId || (patients[0]?.id ?? ''))
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState('Consulta')
  const [notes, setNotes] = useState('')

  const selectedName = useMemo(() => {
    return patients.find((p) => p.id === patientId)?.name ?? ''
  }, [patients, patientId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) return error('Selecione um paciente.')
    if (!date) return error('Escolha a data.')
    if (!time) return error('Escolha o horário.')

    setLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, date, time, type, notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Erro ao criar agendamento')

      success(`Agendamento criado para ${selectedName}!`)
      router.push('/patients')
      router.refresh()
    } catch (err: any) {
      error(err?.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingTop: 18 }}>
      <div
        className="card"
        style={{
          padding: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Novo agendamento</div>
          <div className="muted" style={{ marginTop: 4 }}>
            Crie uma consulta e depois filtre pacientes por período.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link className="btn" href="/patients">Voltar</Link>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="card"
        style={{ marginTop: 12, padding: 18, maxWidth: 820 }}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Paciente</div>
            <select
              className="input"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Data</div>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Horário</div>
              <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Tipo</div>
              <input className="input" value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex: Consulta, Retorno..." />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Observações</div>
            <textarea
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: queixa principal, informações extras..."
              style={{ minHeight: 110, paddingTop: 10 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <Link className="btn" href="/patients">Cancelar</Link>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar agendamento'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
