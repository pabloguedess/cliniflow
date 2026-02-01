export default function BillingPage() {
  return (
    <div className="grid">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Plano</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Aqui vamos colocar o upgrade de plano (Free / Basic / Plus) com checkout.
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 800 }}>Em breve</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Checkout e upgrade automático via Asaas.
        </div>
      </div>
    </div>
  )
}