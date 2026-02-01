'use client'

import { useMemo, useState } from 'react'

const AVATARS = [
  { key: 'avatar_1', icon: '🩺' },
  { key: 'avatar_2', icon: '👨‍⚕️' },
  { key: 'avatar_3', icon: '👩‍⚕️' },
  { key: 'avatar_4', icon: '🏥' },
  { key: 'avatar_5', icon: '🧠' },
  { key: 'avatar_6', icon: '💊' },
]

function daysLeft(expiresAtIso: string | null) {
  if (!expiresAtIso) return null
  const ms = new Date(expiresAtIso).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export default function AccountClient({
  email,
  avatarKey,
  plan,
  expiresAt,
}: {
  email: string
  avatarKey: string
  plan: string
  expiresAt: string | null
}) {
  const left = useMemo(() => daysLeft(expiresAt), [expiresAt])

  // avatar
  const [avatar, setAvatar] = useState(avatarKey)
  const [msg, setMsg] = useState<string | null>(null)

  // email
  const [newEmail, setNewEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')

  // pass
  const [passCode, setPassCode] = useState('')
  const [newPass, setNewPass] = useState('')

  async function saveAvatar(k: string) {
    setAvatar(k)
    setMsg(null)
    const res = await fetch('/api/account/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarKey: k }),
    })
    if (res.ok) setMsg('Avatar atualizado ✅')
    else setMsg('Erro ao atualizar avatar')
  }

  async function requestEmailChange() {
    setMsg(null)
    const res = await fetch('/api/account/request-email-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail }),
    })
    const data = await res.json().catch(() => ({}))
    setMsg(res.ok ? 'Código enviado para o novo email ✅' : (data?.message ?? 'Erro'))
  }

  async function confirmEmailChange() {
    setMsg(null)
    const res = await fetch('/api/account/confirm-email-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: emailCode }),
    })
    const data = await res.json().catch(() => ({}))
    setMsg(res.ok ? 'Email atualizado ✅ (faça logout/login se necessário)' : (data?.message ?? 'Erro'))
  }

  async function requestPasswordChange() {
    setMsg(null)
    const res = await fetch('/api/account/request-password-change', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    setMsg(res.ok ? 'Código enviado para seu email ✅' : (data?.message ?? 'Erro'))
  }

  async function confirmPasswordChange() {
    setMsg(null)
    const res = await fetch('/api/account/confirm-password-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: passCode, newPassword: newPass }),
    })
    const data = await res.json().catch(() => ({}))
    setMsg(res.ok ? 'Senha atualizada ✅' : (data?.message ?? 'Erro'))
  }

  return (
    <div className="grid">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Minha conta</div>
        <div className="muted" style={{ marginTop: 6 }}>Gerencie perfil, segurança e plano</div>
        {msg && <div style={{ marginTop: 10 }} className="muted">{msg}</div>}
      </div>

      {/* Perfil */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 800 }}>Perfil</div>
        <div className="muted" style={{ marginTop: 6 }}>Email atual: {email}</div>

        <div style={{ marginTop: 14, fontWeight: 700 }}>Avatar</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          {AVATARS.map((a) => (
            <button
              key={a.key}
              className="btn"
              type="button"
              onClick={() => saveAvatar(a.key)}
              style={{
                borderColor: avatar === a.key ? 'rgba(0,200,255,0.7)' : undefined,
              }}
            >
              <span style={{ fontSize: 18 }}>{a.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Segurança */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 800 }}>Segurança</div>

        <div style={{ marginTop: 12, display: 'grid', gap: 10, maxWidth: 520 }}>
          <div style={{ fontWeight: 700 }}>Trocar email</div>
          <div className="muted">Enviaremos um código para o novo email.</div>
          <input className="input" placeholder="Novo email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <button className="btn btnPrimary" type="button" onClick={requestEmailChange}>
            Enviar código
          </button>
          <input className="input" placeholder="Código (6 dígitos)" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} />
          <button className="btn" type="button" onClick={confirmEmailChange}>
            Confirmar troca de email
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

        <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
          <div style={{ fontWeight: 700 }}>Trocar senha</div>
          <div className="muted">Enviaremos um código para seu email atual.</div>
          <button className="btn btnPrimary" type="button" onClick={requestPasswordChange}>
            Enviar código
          </button>
          <input className="input" placeholder="Código (6 dígitos)" value={passCode} onChange={(e) => setPassCode(e.target.value)} />
          <input className="input" placeholder="Nova senha (mín 6)" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <button className="btn" type="button" onClick={confirmPasswordChange}>
            Confirmar troca de senha
          </button>
        </div>
      </div>

      {/* Plano */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Plano</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Atual: <b>{plan.toUpperCase()}</b>
          {left !== null ? ` • ${left} dias restantes` : ' • sem expiração'}
        </div>

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          <PlanCard title="Free" price="R$0" desc="Para testar" items={['Até 30 pacientes', 'Sem agenda', 'Sem relatórios']} />
          <PlanCard title="Basic" price="R$59/mês" desc="Clínica pequena" items={['Até 300 pacientes', 'Agenda básica', 'Suporte padrão']} highlight />
          <PlanCard title="Plus" price="R$99/mês" desc="Sem limitações" items={['Pacientes ilimitados', 'Agenda completa', 'Relatórios + export']} />
        </div>

        <div className="muted" style={{ marginTop: 10 }}>
          (Checkout/upgrade: vamos ligar com o Asaas na próxima etapa)
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  title,
  price,
  desc,
  items,
  highlight,
}: {
  title: string
  price: string
  desc: string
  items: string[]
  highlight?: boolean
}) {
  return (
    <div
      className="card"
      style={{
        padding: 14,
        borderColor: highlight ? 'rgba(0,200,255,0.5)' : undefined,
      }}
    >
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div className="muted" style={{ marginTop: 6 }}>{desc}</div>
      <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900 }}>{price}</div>
      <ul style={{ marginTop: 10, paddingLeft: 18 }} className="muted">
        {items.map((x) => <li key={x}>{x}</li>)}
      </ul>
      <button className={`btn ${highlight ? 'btnPrimary' : ''}`} style={{ width: '100%', marginTop: 10 }} type="button">
        Escolher {title}
      </button>
    </div>
  )
}
