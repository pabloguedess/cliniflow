'use client'

import { useMemo, useState } from 'react'

type Patient = { id: string; name: string }

export function PatientSearchSelect({
  patients,
  value,
  onChange,
  placeholder = 'Digite para buscar…',
}: {
  patients: Patient[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return patients.slice(0, 8)
    return patients.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 8)
  }, [q, patients])

  const selected = patients.find((p) => p.id === value)

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={selected ? selected.name : placeholder}
        style={{ paddingRight: 12 }}
      />

      <div
        className="card"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 52,
          zIndex: 20,
          overflow: 'hidden',
          display: (q.trim().length > 0 || !value) ? 'block' : 'none',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: 12 }} className="muted">Nenhum paciente encontrado.</div>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                borderRadius: 0,
                border: 'none',
                borderBottom: '1px solid var(--border)',
                background: 'transparent',
              }}
              onClick={() => {
                onChange(p.id)
                setQ('')
              }}
            >
              <span style={{ fontWeight: 700 }}>{p.name}</span>
              <span className="muted" style={{ fontSize: 12 }}>Selecionar</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
