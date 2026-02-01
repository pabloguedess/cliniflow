import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: 40 }}>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 26, fontWeight: 900 }}>CliniFlow</div>
        <div className="muted" style={{ marginTop: 8 }}>
          Sistema para clínicas: pacientes, prontuário e assinaturas.
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Link className="btn" href="/login">Entrar</Link>
          <Link className="btn" href="/register">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
