'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPatientPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    })

    router.push('/patients')
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Novo paciente</h1>

      <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <input
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
