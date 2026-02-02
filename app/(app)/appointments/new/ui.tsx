'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PatientSearchSelect } from '@/components/PatientSearchSelect'

type Patient = { id: string; name: string }

export default function AppointmentForm({
  patients,
  lockedPatient,
}: {
  patients: Patient[]
  lockedPatient: Patient | null
}) {
  const router = useRouter()
  const [patientId, setPatientId] = useState<string>(lockedPatient?.id || '')
  const [date, setDate] = useState('')
  const [type, setType] = useState('Consulta')
  const [notes, setNotes] = useState('')
  const selectedName = useMemo(() => {
    return lockedPatient?.name || patients.find((p) => p.id === patientId)?.name || ''
  }, [lockedPatient, patients, patientId])

  async function onSave() {
    if (!patientId) return alert('Selecione um paciente.')
    if (!date) return alert('Informe data e horário.')

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        date,
        type,
        notes,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) return alert(data?.message || 'Erro ao salvar agendamento')

    // volta para o paciente
    router.push(`/patients/${patientId}`)
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Paciente</div>

          {lockedPatient ? (
            <input value={selectedName} readOnly />
          ) : (
            <PatientSearchSelect
              patients={patients}
              value={patientId}
              onChange={(id) => setPatientId(id)}
              placeholder="Digite o nome do paciente…"
            />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Data e horário</div>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Tipo</div>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>Consulta</option>
              <option>Retorno</option>
              <option>Exame</option>
              <option>Procedimento</option>
            </select>
          </div>
        </div>

        <div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Observações</div>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: queixa principal, orientação, observações do atendimento..."
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={onSave}>Salvar agendamento</button>
          <button className="btn" onClick={() => router.back()}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
