'use client'

import React, { useEffect, useMemo, useState } from 'react'

type ToastKind = 'success' | 'error' | 'info'

type ToastItem = {
  id: string
  kind: ToastKind
  title: string
  message?: string
  createdAt: number
  ttl: number
}

type Listener = (items: ToastItem[]) => void

let items: ToastItem[] = []
let listeners: Listener[] = []

function emit() {
  for (const l of listeners) l(items)
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function push(kind: ToastKind, title: string, message?: string, ttl = 3200) {
  const id = uid()
  const t: ToastItem = { id, kind, title, message, createdAt: Date.now(), ttl }
  items = [t, ...items].slice(0, 5)
  emit()

  window.setTimeout(() => {
    items = items.filter((x) => x.id !== id)
    emit()
  }, ttl)

  return id
}

function remove(id: string) {
  items = items.filter((x) => x.id !== id)
  emit()
}

export const toast = {
  success: (title: string, message?: string) => push('success', title, message),
  error: (title: string, message?: string) => push('error', title, message, 4200),
  info: (title: string, message?: string) => push('info', title, message),
  dismiss: (id: string) => remove(id),
  dismissAll: () => {
    items = []
    emit()
  },
}

export function ToastViewport() {
  const [state, setState] = useState<ToastItem[]>(items)

  useEffect(() => {
    const listener: Listener = (next) => setState(next)
    listeners.push(listener)
    // garante sync imediata
    setState(items)

    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  const rendered = useMemo(() => state, [state])

  if (rendered.length === 0) return null

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions removals">
      {rendered.map((t) => (
        <div
          key={t.id}
          className={[
            'toast',
            t.kind === 'success' ? 'toast-success' : '',
            t.kind === 'error' ? 'toast-error' : '',
            t.kind === 'info' ? 'toast-info' : '',
          ].join(' ')}
          role="status"
        >
          <div className="toast-dot" />
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.message ? <div className="toast-msg">{t.message}</div> : null}
          </div>
          <button className="toast-x" onClick={() => remove(t.id)} aria-label="Fechar">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
