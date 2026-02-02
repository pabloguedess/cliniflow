'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'dark' | 'light'

type ThemeCtx = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeCtx | null>(null)

function applyTheme(theme: Theme) {
  const root = document.documentElement // <html>
  root.setAttribute('data-theme', theme)
  // opcional: classe também (se você quiser usar .dark/.light)
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    // carregar tema salvo
    const saved = (localStorage.getItem('cliniflow_theme') as Theme | null) ?? null
    const initial: Theme = saved === 'light' ? 'light' : 'dark'
    setThemeState(initial)
    applyTheme(initial)
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('cliniflow_theme', t)
    applyTheme(t)
  }

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
