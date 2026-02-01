'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(data?.message || 'Erro ao entrar')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 20 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>CliniFlow</div>
            <div className="muted" style={{ marginTop: 4 }}>Entre para acessar seu painel</div>
          </div>
          <ThemeToggle />
        </div>

        <form onSubmit={onSubmit} className="grid" style={{ marginTop: 16 }}>
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <button className="btn btnPrimary" disabled={loading} type="submit">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {error && <div style={{ color: '#ff6b6b' }}>{error}</div>}
        </form>

        <div className="muted" style={{ marginTop: 14 }}>
          Não tem conta? <Link href="/register" style={{ textDecoration: 'underline' }}>Criar agora</Link>
        </div>
      </div>
    </div>
  )
}
