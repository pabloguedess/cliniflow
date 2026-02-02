'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

type ToastCtx = {
  toast: (t: Omit<Toast, 'id'>) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid()
    const duration = t.duration ?? 3200
    setToasts((prev) => [...prev, { ...t, id, duration }])
    window.setTimeout(() => remove(id), duration)
  }, [remove])

  const api = useMemo<ToastCtx>(() => ({
    toast,
    success: (message, title) => toast({ type: 'success', title, message }),
    error: (message, title) => toast({ type: 'error', title, message }),
    info: (message, title) => toast({ type: 'info', title, message }),
  }), [toast])

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Container bottom-right */}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-dot" />
            <div className="toast-body">
              {t.title ? <div className="toast-title">{t.title}</div> : null}
              <div className="toast-msg">{t.message}</div>
            </div>
            <button className="toast-x" onClick={() => remove(t.id)} aria-label="Fechar">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
