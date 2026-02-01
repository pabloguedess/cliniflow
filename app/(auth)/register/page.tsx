'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function RegisterPage() {
  const router = useRouter()
  const [clinicName, setClinicName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicName, email, password }),
    })

    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(data?.message || 'Erro ao criar conta')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div
      className="container"
      style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 20 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>CliniFlow</div>
            <div className="muted" style={{ marginTop: 4 }}>
              Crie sua clínica e comece agora
            </div>
          </div>
          <ThemeToggle />
        </div>

        <form onSubmit={onSubmit} className="grid" style={{ marginTop: 16 }}>
          <input
            className="input"
            placeholder="Nome da clínica"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            required
          />

          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="input"
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn btnPrimary" disabled={loading} type="submit">
            {loading ? 'Criando...' : 'Criar conta'}
          </button>

          {error && (
            <div
              style={{
                color: '#ff6b6b',
                border: '1px solid rgba(255, 107, 107, 0.25)',
                background: 'rgba(255, 107, 107, 0.08)',
                padding: 10,
                borderRadius: 12,
              }}
            >
              {error}
            </div>
          )}
        </form>

        <div className="muted" style={{ marginTop: 14 }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ textDecoration: 'underline' }}>
            Entrar
          </Link>
        </div>
      </div>
    </div>
  )
}
