import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RecordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}>Prontuário</div>
        <div className="muted" style={{ marginTop: 8 }}>
          Agora o prontuário completo (registros + exames) fica dentro da ficha do paciente.
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn" href={`/patients/${id}`}>Voltar para o paciente</Link>
          <Link className="btn" href="/patients">Pacientes</Link>
        </div>
      </div>
    </div>
  )
}
