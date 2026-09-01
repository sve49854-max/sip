import { useState } from 'react'

const docs = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'CE' },
] as const

type LoginPageProps = {
  onHome: () => void
}

export function LoginPage({ onHome }: LoginPageProps) {
  const [docType, setDocType] = useState<(typeof docs)[number]['value']>('DNI')
  const [doc, setDoc] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)

  const canSubmit =
    password.trim().length >= 4 &&
    (docType === 'DNI' ? doc.trim().length === 8 : doc.trim().length >= 8)

  return (
    <div className="login-page">
      <header className="login-top">
        <button type="button" className="login-logo" onClick={onHome} aria-label="Sip">
          <img src="/logo-sip.svg" width={60} height={40} alt="" />
        </button>
        <div className="login-social">
          <a href="https://www.facebook.com/sip.peru.billetera/" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1Z" />
            </svg>
          </a>
          <a href="https://www.instagram.com/sip.peru.oficial/" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2ZM17.2 7.1a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9Z" />
            </svg>
          </a>
        </div>
      </header>

      <div className="login-body">
        <section className="login-visual" aria-hidden>
          <img src="/login-hero.webp" alt="" />
          <div className="login-banner">
            <p>Bienvenido a</p>
            <h1>
              <span>Sip</span> en línea
            </h1>
            <p>Estás en una zona segura</p>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-inner">
            <h2>Inicia sesión</h2>

            {done ? (
              <div className="login-ok">
                <p>Ingresaste a Sip en línea.</p>
                <button type="button" className="btn btn-blue small" onClick={onHome}>
                  Ir al inicio
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (canSubmit) setDone(true)
                }}
              >
                <div className="login-row">
                  <label className="login-select">
                    <span className="sr-only">Tipo de documento</span>
                    <select
                      value={docType}
                      onChange={(e) =>
                        setDocType(e.target.value as (typeof docs)[number]['value'])
                      }
                    >
                      {docs.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="login-field grow">
                    <span className="sr-only">Número de documento</span>
                    <input
                      value={doc}
                      onChange={(e) => setDoc(e.target.value)}
                      placeholder="Número de documento"
                      inputMode="numeric"
                    />
                  </label>
                </div>

                <label className="login-field">
                  <span className="sr-only">Clave digital</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Clave digital"
                  />
                </label>

                <a className="login-forgot" href="#olvide">
                  ¿Olvidaste tu clave?
                </a>

                <button
                  type="submit"
                  className={`login-submit${canSubmit ? ' ready' : ''}`}
                  disabled={!canSubmit}
                >
                  Iniciar sesión
                </button>

                <button type="button" className="login-outline">
                  Crear o cambiar clave digital
                </button>
              </form>
            )}
          </div>

          <div className="login-contact">
            <strong>Contáctanos</strong>
            <p>Lima: 01 619 – 4800</p>
            <p>Provincias: 08010 – 0002</p>
          </div>
        </section>
      </div>
    </div>
  )
}
