'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeletePatientButton({ patientId }: { patientId: string }) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [loading, setLoading] = useState(false)

  function open() {
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
  }

  async function confirmDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data.message || 'Erro ao excluir')

      close()

      // aqui depois você pode trocar por toast (popup canto inferior direito)
      alert('Paciente excluído com sucesso.')

      router.push('/patients')
      router.refresh()
    } catch (err: any) {
      alert(err?.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={open}
        style={{
          borderColor: 'rgba(255,80,80,.35)',
          background: 'rgba(255,80,80,.12)',
        }}
      >
        Excluir paciente
      </button>

      <dialog
        ref={dialogRef}
        style={{
          border: 'none',
          padding: 0,
          background: 'transparent',
          width: 'min(520px, 92vw)',
        }}
      >
        {/* backdrop */}
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.55)',
          }}
        />

        {/* modal */}
        <div
          className="card"
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            padding: 16,
            width: 'min(520px, 92vw)',
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>Confirmar exclusão</div>
          <div className="muted" style={{ marginTop: 8, lineHeight: 1.4 }}>
            Tem certeza que deseja <b>excluir este paciente</b>?<br />
            Isso vai desativar o paciente (não apaga histórico), e ele não aparecerá mais na lista.
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
            <button className="btn" type="button" onClick={close} disabled={loading}>
              Cancelar
            </button>

            <button
              className="btn"
              type="button"
              onClick={confirmDelete}
              disabled={loading}
              style={{
                borderColor: 'rgba(255,80,80,.45)',
                background: 'rgba(255,80,80,.16)',
                fontWeight: 900,
              }}
            >
              {loading ? 'Excluindo...' : 'Sim, excluir'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
