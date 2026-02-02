'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Suggestion = { label: string; lat: string; lon: string }

function useDebounced(value: string, delay = 250) {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    cpf: '',
    rg: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  function setField(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  // ✅ autocomplete endereço
  const [addrOpen, setAddrOpen] = useState(false)
  const [addrLoading, setAddrLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const addrDebounced = useDebounced(form.address, 250)

  useEffect(() => {
    let ignore = false

    async function run() {
      const q = addrDebounced.trim()
      if (q.length < 3) {
        setSuggestions([])
        setAddrOpen(false)
        return
      }

      setAddrLoading(true)
      try {
        const res = await fetch(`/api/geo/address?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!ignore) {
          setSuggestions(data.results || [])
          setAddrOpen(true)
        }
      } catch {
        if (!ignore) {
          setSuggestions([])
          setAddrOpen(false)
        }
      } finally {
        if (!ignore) setAddrLoading(false)
      }
    }

    run()
    return () => {
      ignore = true
    }
  }, [addrDebounced])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Erro ao criar paciente')

      router.push(`/patients/${data.patient.id}`)
    } catch (err: any) {
      alert(err.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Novo paciente</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Preencha a ficha completa para contato e histórico.
        </div>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ marginTop: 12, padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Nome completo *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Ex: Maria Silva"
              required
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>CPF</label>
            <input className="input" value={form.cpf} onChange={(e) => setField('cpf', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>RG</label>
            <input className="input" value={form.rg} onChange={(e) => setField('rg', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Nascimento</label>
            <input className="input" type="date" value={form.birthDate} onChange={(e) => setField('birthDate', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Gênero</label>
            <select className="input" value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
              <option value="">Selecione</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro</option>
              <option value="Prefere não informar">Prefere não informar</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Telefone</label>
            <input className="input" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="(11) 99999-9999" />
          </div>

          <div style={{ display: 'grid', gap: 6, gridColumn: '1 / span 2' }}>
            <label className="muted" style={{ fontSize: 12 }}>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </div>

          {/* ✅ Endereço com sugestões */}
          <div style={{ display: 'grid', gap: 6, gridColumn: '1 / span 3', position: 'relative' }}>
            <label className="muted" style={{ fontSize: 12 }}>
              Endereço {addrLoading ? '(buscando...)' : ''}
            </label>

            <input
              className="input"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder="Digite rua, bairro, cidade..."
              onFocus={() => {
                if (suggestions.length) setAddrOpen(true)
              }}
              onBlur={() => {
                // pequeno atraso para permitir clique na sugestão
                setTimeout(() => setAddrOpen(false), 150)
              }}
            />

            {addrOpen && suggestions.length > 0 && (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  top: 68,
                  left: 0,
                  right: 0,
                  padding: 8,
                  zIndex: 20,
                  display: 'grid',
                  gap: 6,
                }}
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn"
                    style={{ textAlign: 'left', width: '100%' }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setField('address', s.label)
                      setAddrOpen(false)
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 6, gridColumn: '1 / span 3' }}>
            <label className="muted" style={{ fontSize: 12 }}>Observações</label>
            <textarea
              className="input"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar paciente'}
          </button>
          <button className="btn" type="button" onClick={() => router.push('/patients')}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
