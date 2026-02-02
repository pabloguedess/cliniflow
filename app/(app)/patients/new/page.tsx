'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type AddressItem = {
  placeId: string
  label: string
  road: string
  number: string
  suburb: string
  city: string
  state: string
  postcode: string
}

export default function NewPatientPage() {
  const router = useRouter()

  // Dados básicos
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [rg, setRg] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')

  // Endereço (separado e completo)
  const [addressQuery, setAddressQuery] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [stateUf, setStateUf] = useState('')
  const [cep, setCep] = useState('')

  const [notes, setNotes] = useState('')

  // Autocomplete
  const [items, setItems] = useState<AddressItem[]>([])
  const [open, setOpen] = useState(false)
  const [loadingAddr, setLoadingAddr] = useState(false)
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<any>(null)

  const fullAddress = useMemo(() => {
    const line1 = [street, number].filter(Boolean).join(', ')
    const line2 = [neighborhood, city].filter(Boolean).join(', ')
    const line3 = [stateUf].filter(Boolean).join('')
    const line4 = cep ? `CEP ${cep}` : ''
    return [line1, line2 ? `- ${line2}` : '', line3 ? `- ${line3}` : '', line4].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  }, [street, number, neighborhood, city, stateUf, cep])

  useEffect(() => {
    const q = addressQuery.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (q.length < 3) {
      setItems([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingAddr(true)
      try {
        const res = await fetch(`/api/address/search?q=${encodeURIComponent(q)}`)
        const data = await res.json().catch(() => ({ items: [] }))
        const list = Array.isArray(data.items) ? data.items : []
        setItems(list)
        setOpen(true)
      } catch {
        setItems([])
        setOpen(false)
      } finally {
        setLoadingAddr(false)
      }
    }, 250)
  }, [addressQuery])

  function pickAddress(it: AddressItem) {
    // preenche campos principais
    setStreet(it.road || '')
    setNeighborhood(it.suburb || '')
    setCity(it.city || '')
    setStateUf(it.state || '')
    setCep(it.postcode || '')
    // número é melhor deixar pro usuário confirmar/editar
    if (!number) setNumber(it.number || '')
    // mostra no input como "Uber"
    setAddressQuery(it.label)
    setOpen(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      alert('Nome é obrigatório.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          cpf: cpf.trim() || null,
          rg: rg.trim() || null,
          birthDate: birthDate ? new Date(birthDate).toISOString() : null,
          gender: gender || null,
          address: fullAddress || null,
          notes: notes.trim() || null,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Erro ao criar paciente')

      router.push('/patients')
      router.refresh()
    } catch (err: any) {
      alert(err?.message || 'Erro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Novo paciente</div>
          <div className="muted" style={{ marginTop: 6 }}>Preencha a ficha completa para contato e histórico.</div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn" href="/patients">Voltar</Link>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ marginTop: 12, padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Nome *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Maria Silva" />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Telefone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Gênero</label>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Selecione</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro</option>
              <option value="Prefiro não informar">Prefiro não informar</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>CPF</label>
            <input className="input" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>RG</label>
            <input className="input" value={rg} onChange={(e) => setRg(e.target.value)} placeholder="00.000.000-0" />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Data de nascimento</label>
            <input className="input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
        </div>

        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Endereço</div>

          <div style={{ position: 'relative' }}>
            <label className="muted" style={{ fontSize: 12 }}>Buscar endereço (autocomplete)</label>
            <input
              className="input"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              onFocus={() => items.length && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 180)}
              placeholder="Digite rua e cidade... (ex.: Av Paulista, São Paulo)"
              style={{ marginTop: 6 }}
            />

            {loadingAddr ? (
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Buscando sugestões...</div>
            ) : null}

            {open && items.length > 0 ? (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  padding: 6,
                }}
              >
                {items.map((it) => (
                  <button
                    type="button"
                    key={it.placeId}
                    className="btn"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      marginBottom: 6,
                      whiteSpace: 'normal',
                      textAlign: 'left',
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickAddress(it)}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12, marginTop: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label className="muted" style={{ fontSize: 12 }}>Rua</label>
              <input className="input" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua / Avenida" />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <label className="muted" style={{ fontSize: 12 }}>Número</label>
              <input className="input" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label className="muted" style={{ fontSize: 12 }}>Bairro</label>
              <input className="input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <label className="muted" style={{ fontSize: 12 }}>Cidade</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12, marginTop: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label className="muted" style={{ fontSize: 12 }}>Estado (UF)</label>
              <input className="input" value={stateUf} onChange={(e) => setStateUf(e.target.value)} placeholder="SP" />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <label className="muted" style={{ fontSize: 12 }}>CEP</label>
              <input className="input" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
            </div>
          </div>

          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Endereço que será salvo: <b>{fullAddress || '—'}</b>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 6, marginTop: 14 }}>
          <label className="muted" style={{ fontSize: 12 }}>Observações</label>
          <textarea
            className="input"
            style={{ minHeight: 110, resize: 'vertical' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: alergias, observações importantes, histórico rápido..."
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar paciente'}
          </button>
          <Link className="btn" href="/patients">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
