import Link from 'next/link'

export default function PatientRecordsPage({ params }: { params: { id: string } }) {
  return (
    <div className="grid">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Prontuários</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Paciente: <span style={{ fontFamily: 'monospace' }}>{params.id}</span>
            </div>
          </div>
          <Link className="btn" href={`/patients/${params.id}`}>Voltar</Link>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 800 }}>Em breve</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Aqui vai a lista de consultas e registros médicos do paciente.
        </div>
      </div>
    </div>
  )
}
