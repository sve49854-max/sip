import { useState } from 'react'

type ApplyModalProps = {
  mode: 'cts' | 'card' | 'login'
  onClose: () => void
}

const copy = {
  cts: {
    title: 'Abre tu Cuenta CTS',
    text: 'Déjanos tus datos y te contactamos para trasladar tu CTS a Sip.',
  },
  card: {
    title: 'Solicita tu Tarjeta Sip',
    text: 'Completa el formulario y te guiaremos para pedir tu tarjeta.',
  },
  login: {
    title: 'Mi cuenta',
    text: 'Ingresa con tu documento para ver tus productos Sip.',
  },
}

export function ApplyModal({ mode, onClose }: ApplyModalProps) {
  const [sent, setSent] = useState(false)

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="success">
            <h2 id="modal-title">¡Listo!</h2>
            <p>
              Recibimos tu solicitud. Un asesor Sip te contactará en breve.
            </p>
            <button type="button" className="btn btn-blue small" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <h2 id="modal-title">{copy[mode].title}</h2>
            <p>{copy[mode].text}</p>
            <label>
              DNI
              <input required name="dni" inputMode="numeric" maxLength={8} />
            </label>
            {mode !== 'login' ? (
              <label>
                Nombre completo
                <input required name="name" />
              </label>
            ) : null}
            <label>
              Celular
              <input required name="phone" inputMode="tel" />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-white" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-blue small">
                {mode === 'login' ? 'Ingresar' : 'Enviar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
