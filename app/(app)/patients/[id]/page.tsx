import Link from 'next/link'

export default function PatientDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="grid">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Paciente</div>
            <div className="muted" style={{ marginTop: 6 }}>
              ID: <span style={{ fontFamily: 'monospace' }}>{params.id}</span>
            </div>
          </div>

          <Link className="btn" href="/patients">
            Voltar
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 800 }}>Detalhes</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Aqui vamos mostrar ficha do paciente, consultas, prontuário e anexos.
        </div>
      </div>
    </div>
  )
}
