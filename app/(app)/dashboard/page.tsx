export default function DashboardPage() {
  return (
    <div className="grid">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Dashboard</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Visão geral do seu sistema. (Vamos colocar métricas aqui em seguida.)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="muted">Pacientes</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>—</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="muted">Consultas</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>—</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="muted">Plano</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>—</div>
        </div>
      </div>
    </div>
  )
}
