'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Patient = {
  id: string
  name: string
  phone: string | null
  email: string | null
  createdAt: string
}

function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function PatientsClient() {
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 250)

  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load(q: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Erro ao carregar pacientes')
      setPatients(data.patients || [])
    } catch (e: any) {
      setError(e.message || 'Erro')
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(debounced)
  }, [debounced])

  const countLabel = useMemo(() => {
    if (loading) return 'Carregando...'
    if (search.trim()) return `${patients.length} encontrado(s)`
    return `${patients.length} paciente(s)`
  }, [loading, patients.length, search])

  return (
    <div style={{ paddingTop: 18 }}>
      <div
        className="card"
        style={{
          padding: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Pacientes</div>
          <div className="muted" style={{ marginTop: 6 }}>{countLabel}</div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            style={{ width: 260 }}
          />
          <Link className="btn" href="/patients/new">Novo paciente</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 14 }}>
        {error ? (
          <div className="muted">{error}</div>
        ) : loading ? (
          <div className="muted">Carregando...</div>
        ) : patients.length === 0 ? (
          <div className="muted">Nenhum paciente encontrado.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {patients.map((p) => (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 240 }}>
                  <div style={{ fontWeight: 900 }}>{p.name}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {p.phone ? `📞 ${p.phone}` : '📞 —'} • {p.email ? `✉️ ${p.email}` : '✉️ —'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {/* ✅ IMPORTANTE: sempre usa p.id aqui */}
                  <Link className="btn" href={`/patients/${p.id}`}>Abrir</Link>
                  <Link className="btn" href={`/patients/${p.id}/records`}>Prontuário</Link>
                  <Link className="btn" href={`/appointments/new?patientId=${p.id}`}>Agendar</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
