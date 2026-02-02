'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/toast/ToastProvider'

export default function NewPatientPage() {
  const router = useRouter()
  const { success, error } = useToast()

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      error('Informe o nome do paciente.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Erro ao salvar paciente')

      success('Paciente criado com sucesso!')
      router.push('/patients')
      router.refresh()
    } catch (err: any) {
      error(err?.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingTop: 18 }}>
      <div
        className="card"
        style={{
          padding: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Novo paciente</div>
          <div className="muted" style={{ marginTop: 4 }}>
            Cadastre rapidamente para iniciar o prontuário.
          </div>
        </div>

        <Link className="btn" href="/patients">
          Voltar
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        className="card"
        style={{
          marginTop: 12,
          padding: 18,
          maxWidth: 720,
        }}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Nome *</div>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Souza"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Telefone</div>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 800 }}>E-mail</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <Link className="btn" href="/patients">
              Cancelar
            </Link>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar paciente'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
