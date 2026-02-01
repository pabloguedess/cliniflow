'use client'

import Link from 'next/link'
import { useState } from 'react'

const AVATARS: Record<string, string> = {
  avatar_1: '🩺',
  avatar_2: '👨‍⚕️',
  avatar_3: '👩‍⚕️',
  avatar_4: '🏥',
  avatar_5: '🧠',
  avatar_6: '💊',
}

export function AvatarMenu({
  avatarKey,
}: {
  avatarKey: string
}) {
  const [open, setOpen] = useState(false)
  const icon = AVATARS[avatarKey] ?? '🩺'

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn" type="button" onClick={() => setOpen(!open)} aria-label="Conta">
        <span style={{ fontSize: 18 }}>{icon}</span>
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 46,
            width: 220,
            padding: 10,
            zIndex: 10,
          }}
        >
          <Link className="btn" href="/account" onClick={() => setOpen(false)}>
            Minha conta
          </Link>

          <form action="/api/auth/logout" method="post" style={{ marginTop: 8 }}>
            <button className="btn" type="submit">Sair</button>
          </form>

          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            Dica: ajuste email/senha e plano em “Minha conta”.
          </div>
        </div>
      )}
    </div>
  )
}
