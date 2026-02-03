import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AvatarMenu } from '@/components/AvatarMenu'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) {
    return <div className="container">Não autorizado</div>
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { avatarKey: true },
  })

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 5, padding: 16 }}>
        <div
          className="card"
          style={{
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>CliniFlow</div>
            <div className="muted" style={{ fontSize: 13 }}>Painel</div>

            <nav style={{ marginLeft: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn" href="/dashboard">Dashboard</Link>
              <Link className="btn" href="/patients">Pacientes</Link>
              <Link className="btn" href="/appointments">Agendamentos</Link>
              <Link className="btn" href="/billing">Plano</Link>
            </nav>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <ThemeToggle />
            <AvatarMenu avatarKey={user?.avatarKey ?? 'avatar_1'} />
          </div>
        </div>
      </header>

      <main className="container">{children}</main>
    </div>
  )
}
