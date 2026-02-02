'use client'

import { useTheme } from '@/components/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      type="button"
      className="btn"
      onClick={toggle}
      title="Alternar tema"
      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
    >
      <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
      <span style={{ opacity: 0.85 }}>{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
    </button>
  )
}
