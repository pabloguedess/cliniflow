'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isLight = (theme ?? resolvedTheme) === 'light'

  return (
    <button
      className="btn"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      title="Alternar tema"
      type="button"
    >
      {isLight ? '🌙 Escuro' : '☀️ Claro'}
    </button>
  )
}
