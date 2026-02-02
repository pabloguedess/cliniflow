'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

      // ✅ vai direto pro paciente criado
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
          Preencha a ficha completa para facilitar contato e histórico clínico.
        </div>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ marginTop: 12, padding: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            gap: 12,
          }}
        >
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
            <input
              className="input"
              value={form.cpf}
              onChange={(e) => setField('cpf', e.target.value)}
              placeholder="Somente números ou formatado"
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>RG</label>
            <input
              className="input"
              value={form.rg}
              onChange={(e) => setField('rg', e.target.value)}
              placeholder="RG"
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Data de nascimento</label>
            <input
              className="input"
              type="date"
              value={form.birthDate}
              onChange={(e) => setField('birthDate', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Gênero</label>
            <select
              className="input"
              value={form.gender}
              onChange={(e) => setField('gender', e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro</option>
              <option value="Prefere não informar">Prefere não informar</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Telefone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div style={{ display: 'grid', gap: 6, gridColumn: '1 / span 2' }}>
            <label className="muted" style={{ fontSize: 12 }}>Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div style={{ display: 'grid', gap: 6, gridColumn: '1 / span 3' }}>
            <label className="muted" style={{ fontSize: 12 }}>Endereço</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder="Rua, número, bairro, cidade, UF"
            />
          </div>

          <div style={{ display: 'grid', gap: 6, gridColumn: '1 / span 3' }}>
            <label className="muted" style={{ fontSize: 12 }}>Observações</label>
            <textarea
              className="input"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Alergias, observações, preferências..."
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
