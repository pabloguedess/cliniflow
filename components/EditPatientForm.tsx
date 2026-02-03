'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast/ToastProvider'

type Patient = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  cpf?: string | null
  rg?: string | null
  birthDate?: string | Date | null
  gender?: string | null
  address?: string | null
  notes?: string | null
}

export default function EditPatientForm({ patient }: { patient: Patient }) {
  const router = useRouter()
  const toast = useToast()

  const [loading, setLoading] = React.useState(false)

  const [form, setForm] = React.useState({
    name: patient.name || '',
    phone: patient.phone || '',
    email: patient.email || '',
    cpf: patient.cpf || '',
    rg: patient.rg || '',
    birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().slice(0, 10) : '',
    gender: patient.gender || '',
    address: patient.address || '',
    notes: patient.notes || '',
  })

  function onChange(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.info('Informe o nome do paciente.', 'Atenção')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthDate: form.birthDate ? new Date(form.birthDate) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Erro ao salvar')

      toast.success('Ficha atualizada com sucesso.')
      router.push(`/patients/${patient.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSave} className="card" style={{ padding: 18 }}>
      <div className="grid" style={{ gap: 12 }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Nome</div>
            <input className="input" value={form.name} onChange={(e) => onChange('name', e.target.value)} />
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Telefone</div>
            <input className="input" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Email</div>
            <input className="input" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Gênero</div>
            <input className="input" value={form.gender} onChange={(e) => onChange('gender', e.target.value)} />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>CPF</div>
            <input className="input" value={form.cpf} onChange={(e) => onChange('cpf', e.target.value)} />
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>RG</div>
            <input className="input" value={form.rg} onChange={(e) => onChange('rg', e.target.value)} />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Nascimento</div>
            <input
              type="date"
              className="input"
              value={form.birthDate}
              onChange={(e) => onChange('birthDate', e.target.value)}
            />
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Endereço</div>
            <input className="input" value={form.address} onChange={(e) => onChange('address', e.target.value)} />
          </div>
        </div>

        <div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Observações</div>
          <textarea
            className="input"
            style={{ minHeight: 110, resize: 'vertical' }}
            value={form.notes}
            onChange={(e) => onChange('notes', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btnPrimary" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </form>
  )
}
