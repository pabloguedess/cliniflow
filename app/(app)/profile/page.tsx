import Link from 'next/link'

export default function ProfilePage() {
  return (
    <div className="grid">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Perfil</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Configurações básicas do usuário.
            </div>
          </div>
          <Link className="btn" href="/account">Ir para Minha conta</Link>
        </div>
      </div>
    </div>
  )
}
