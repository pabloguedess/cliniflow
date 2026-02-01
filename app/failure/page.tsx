import Link from 'next/link'

export default function FailurePage() {
  return (
    <div className="container" style={{ paddingTop: 40 }}>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>Pagamento não concluído ❌</div>
        <div className="muted" style={{ marginTop: 8 }}>
          Você pode tentar novamente.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Link className="btn" href="/billing">Voltar aos planos</Link>
          <Link className="btn" href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
