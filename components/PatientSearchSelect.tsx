'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/Toast'

type Patient = { id: string; name: string }

export default function PatientSearchSelect() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Patient[]>([])
  const [selected, setSelected] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)

  const showList = useMemo(() => q.trim().length >= 1 && !selected, [q, selected])

  useEffect(() => {
    let alive = true

    async function run() {
      const text = q.trim()
      if (text.length < 1 || selected) {
        setItems([])
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(text)}`, { cache: 'no-store' })
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          if (alive) setItems([])
          return
        }

        if (alive) setItems(data?.items || [])
      } catch (e) {
        console.error(e)
        if (alive) setItems([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    const t = window.setTimeout(run, 180)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [q, selected])

  function choose(p: Patient) {
    setSelected(p)
    setQ(p.name)
    setItems([])
  }

  function clear() {
    setSelected(null)
    setQ('')
    setItems([])
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Campo visível */}
      <input
        className="input"
        value={q}
        placeholder="Digite para buscar..."
        onChange={(e) => {
          setQ(e.target.value)
          if (selected) setSelected(null)
        }}
      />

      {/* hidden que vai para o form */}
      <input type="hidden" name="patientId" value={selected?.id || ''} required />

      {/* Ações */}
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {selected ? (
          <div className="muted" style={{ fontSize: 12 }}>
            Selecionado: <b>{selected.name}</b>
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 12 }}>
            {loading ? 'Buscando...' : 'Selecione um paciente da lista'}
          </div>
        )}

        {selected ? (
          <button
            type="button"
            className="btn"
            onClick={clear}
            style={{ padding: '8px 10px' }}
          >
            Trocar
          </button>
        ) : null}
      </div>

      {/* Lista sugestões */}
      {showList ? (
        <div
          className="card"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 10px)',
            padding: 8,
            zIndex: 20,
          }}
        >
          {items.length === 0 ? (
            <div className="muted" style={{ padding: 10 }}>
              Nenhum paciente encontrado.
            </div>
          ) : (
            <div className="grid" style={{ gap: 8 }}>
              {items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="btn"
                  style={{ textAlign: 'left', justifyContent: 'flex-start' as any }}
                  onClick={() => {
                    choose(p)
                    toast.info('Paciente selecionado')
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
