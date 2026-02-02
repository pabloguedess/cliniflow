'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Patient = { id: string; name: string }

export default function NewAppointmentForm({
  fixedPatient,
  patients,
}: {
  fixedPatient: Patient | null
  patients: Patient[]
}) {
  const router = useRouter()

  const [patientId, setPatientId] = useState(fixedPatient?.id ?? '')
  const [dateTime, setDateTime] = useState('')
  const [type, setType] = useState('Consulta')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const patientLabel = useMemo(() => {
    if (fixedPatient) return fixedPatient.name
    const p = patients.find(x => x.id === patientId)
    return p?.name ?? ''
  }, [fixedPatient, patients, patientId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!patientId) {
      alert('Selecione o paciente.')
      return
    }
    if (!dateTime) {
      alert('Informe data e horário.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          date: dateTime,
          type,
          notes,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar agendamento')

      // volta para o paciente certo
      router.push(`/patients/${patientId}`)
      router.refresh()
    } catch (err: any) {
      alert(err?.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <label className="muted" style={{ fontSize: 12 }}>Paciente</label>

        {fixedPatient ? (
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 800 }}>{fixedPatient.name}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              ID: {fixedPatient.id}
            </div>
            <input type="hidden" value={patientId} />
          </div>
        ) : (
          <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Selecione</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label className="muted" style={{ fontSize: 12 }}>Data e horário</label>
          <input
            className="input"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label className="muted" style={{ fontSize: 12 }}>Tipo</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option>Consulta</option>
            <option>Retorno</option>
            <option>Exame</option>
            <option>Procedimento</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label className="muted" style={{ fontSize: 12 }}>Observações</label>
        <textarea
          className="input"
          style={{ minHeight: 110, resize: 'vertical' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: queixa principal, orientação, observações do atendimento..."
        />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar agendamento'}
        </button>

        <button
          className="btn"
          type="button"
          onClick={() => router.push(fixedPatient ? `/patients/${fixedPatient.id}` : '/patients')}
          disabled={loading}
        >
          Cancelar
        </button>

        {patientLabel ? (
          <div className="muted" style={{ alignSelf: 'center' }}>
            Agendando para: <b>{patientLabel}</b>
          </div>
        ) : null}
      </div>
    </form>
  )
}
