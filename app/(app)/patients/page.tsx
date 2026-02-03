'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/Toast'

type Patient = {
  id: string
  name: string
  phone: string | null
  email: string | null
}

export default function PatientsPage() {
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/patients', { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar pacientes')
      const data = await res.json()
      setPatients(data.patients || [])
    } catch {
      toast.error('Erro', 'Não foi possível carregar os pacientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return patients
    return patients.filter(p => p.name.toLowerCase().includes(term))
  }, [patients, q])

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Pacientes</div>
          <div className="muted" style={{ marginTop: 4 }}>
            {loading ? 'Carregando...' : `${filtered.length} paciente(s)`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            className="input"
            style={{ width: 280 }}
            placeholder="Buscar por nome..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Link className="btn btnPrimary" href="/patients/new">
            Novo paciente
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 12 }}>
        {filtered.length === 0 ? (
          <div className="muted" style={{ padding: 14 }}>
            Nenhum paciente encontrado.
          </div>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            {filtered.map((p) => (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: 14,
                  borderRadius: 16,
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div className="muted" style={{ marginTop: 4, fontSize: 13, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span>📞 {p.phone || '—'}</span>
                    <span>✉️ {p.email || '—'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Link className="btn" href={`/patients/${p.id}`}>
                    Abrir
                  </Link>
                  <Link className="btn" href={`/appointments/new?patientId=${p.id}`}>
                    Agendar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
