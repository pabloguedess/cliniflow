import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="container" style={{ paddingTop: 40 }}>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>Pagamento aprovado ✅</div>
        <div className="muted" style={{ marginTop: 8 }}>
          Obrigado! Seu plano será atualizado automaticamente.
        </div>
        <div style={{ marginTop: 16 }}>
          <Link className="btn" href="/dashboard">Ir para o Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
