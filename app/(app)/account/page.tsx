import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import AccountClient from './ui'

export default async function AccountPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('cliniflow_session')?.value
  const session = verifySession(sessionCookie)

  if (!session) return <div className="container">Não autorizado</div>

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, avatarKey: true },
  })

  const sub = await prisma.subscription.findFirst({
    where: { tenantId: session.tenantId, status: 'active' },
    orderBy: { createdAt: 'desc' },
    select: { plan: true, expiresAt: true },
  })

  return (
    <AccountClient
      email={user?.email ?? ''}
      avatarKey={user?.avatarKey ?? 'avatar_1'}
      plan={sub?.plan ?? 'free'}
      expiresAt={sub?.expiresAt?.toISOString() ?? null}
    />
  )
}
