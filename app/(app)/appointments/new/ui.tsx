'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Patient = { id: string; name: string }

export default function AppointmentForm({
  lockedPatient,
  patients,
}: {
  lockedPatient: Patient | null
  patients: Patient[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [patientId, setPatientId] = useState(lockedPatient?.id ?? '')
  const [date, setDate] = useState('')
  const [type, setType] = useState('Consulta')
  const [notes, setNotes] = useState('')

  const showSelector = !lockedPatient

  const selectedName = useMemo(() => {
    if (lockedPatient) return lockedPatient.name
    return patients.find((p) => p.id === patientId)?.name ?? ''
  }, [lockedPatient, patients, patientId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!patientId) throw new Error('Selecione um paciente')
      if (!date) throw new Error('Escolha data e horário')

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          date: new Date(date).toISOString(),
          type,
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Erro ao criar agendamento')

      router.push(`/patients/${patientId}`)
    } catch (err: any) {
      alert(err.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <label className="muted" style={{ fontSize: 12 }}>Paciente</label>

        {showSelector ? (
          <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Selecione</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ) : (
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900 }}>{selectedName}</div>
            <div className="muted" style={{ fontSize: 12 }}>Paciente travado (abriu pelo botão “Agendar”)</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label className="muted" style={{ fontSize: 12 }}>Data e horário</label>
          <input className="input" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label className="muted" style={{ fontSize: 12 }}>Tipo</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Consulta">Consulta</option>
            <option value="Retorno">Retorno</option>
            <option value="Avaliação">Avaliação</option>
            <option value="Procedimento">Procedimento</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label className="muted" style={{ fontSize: 12 }}>Observações</label>
        <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" disabled={loading} type="submit">
          {loading ? 'Salvando...' : 'Salvar agendamento'}
        </button>
        <button className="btn" type="button" onClick={() => router.back()}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
