import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AvatarMenu } from '@/components/AvatarMenu'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ⚠️ cookies() é async no Next 16
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        Não autorizado
      </div>
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { avatarKey: true },
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: 16,
        }}
      >
        <div
          className="card"
          style={{
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* ESQUERDA */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>CliniFlow</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Painel
            </div>

            <nav style={{ marginLeft: 10, display: 'flex', gap: 8 }}>
              <Link className="btn" href="/dashboard">
                Dashboard
              </Link>
              <Link className="btn" href="/patients">
                Pacientes
              </Link>
              <Link className="btn" href="/billing">
                Plano
              </Link>
            </nav>
          </div>

          {/* DIREITA */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              marginLeft: 'auto',
            }}
          >
            <ThemeToggle />
            <AvatarMenu avatarKey={user?.avatarKey ?? 'avatar_1'} />
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="container" style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}
