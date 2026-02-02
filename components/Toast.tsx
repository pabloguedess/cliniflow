'use client'

import React from 'react'

type ToastItem = { id: string; title: string; description?: string; variant?: 'success' | 'error' | 'info' }

const ToastCtx = React.createContext<{
  push: (t: Omit<ToastItem, 'id'>) => void
} | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider />')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const push = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID()
    const item: ToastItem = { id, variant: 'info', ...t }
    setItems((prev) => [item, ...prev].slice(0, 4))
    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id))
    }, 3800)
  }, [])

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}

      <div
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 9999,
          display: 'grid',
          gap: 10,
          width: 'min(420px, calc(100vw - 32px))',
        }}
      >
        {items.map((t) => (
          <div key={t.id} className="card" style={{ padding: 14, border: '1px solid rgba(255,255,255,.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontWeight: 900 }}>
                {t.variant === 'success' ? '✅ ' : t.variant === 'error' ? '⚠️ ' : 'ℹ️ '}
                {t.title}
              </div>
              <button className="btn" type="button" onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}>
                Fechar
              </button>
            </div>
            {t.description ? <div className="muted" style={{ marginTop: 8 }}>{t.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
