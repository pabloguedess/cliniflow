import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/toast/ToastProvider'

export const metadata: Metadata = {
  title: 'CliniFlow',
  description: 'Sistema de gestão para clínicas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}