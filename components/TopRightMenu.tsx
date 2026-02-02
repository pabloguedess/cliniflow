'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export function TopRightMenu({
  onLogout,
}: {
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <span>🙂</span>
        <span style={{ opacity: 0.85 }}>Conta</span>
      </button>

      {open ? (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: 260,
            padding: 12,
            display: 'grid',
            gap: 10,
          }}
        >
          <Link className="btn" href="/account" onClick={() => setOpen(false)}>
            Minha conta
          </Link>

          <button className="btn" onClick={() => { setOpen(false); onLogout() }}>
            Sair
          </button>

          <div className="muted" style={{ fontSize: 12 }}>
            Dica: ajuste e-mail/senha e plano em “Minha conta”.
          </div>
        </div>
      ) : null}
    </div>
  )
}
