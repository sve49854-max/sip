import { useEffect, useRef, useState } from 'react'
import { SipLogo } from './Icons'

const docs = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'CE' },
] as const

const PIN_LEN = 6

function shuffleDigits() {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[digits[i], digits[j]] = [digits[j], digits[i]]
  }
  return digits
}

function sanitizeDoc(type: 'DNI' | 'CE', value: string) {
  if (type === 'DNI') return value.replace(/\D/g, '').slice(0, 8)
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)
}

function isDocValid(type: 'DNI' | 'CE', value: string) {
  const doc = value.trim()
  if (type === 'DNI') return /^\d{8}$/.test(doc)
  return doc.length >= 6 && doc.length <= 12
}

type LoginPageProps = {
  onHome: () => void
}

export function LoginPage({ onHome }: LoginPageProps) {
  const [docType, setDocType] = useState<(typeof docs)[number]['value']>('DNI')
  const [doc, setDoc] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [showKeypad, setShowKeypad] = useState(false)
  const [digits, setDigits] = useState(shuffleDigits)
  const [loading, setLoading] = useState(true)
  const pinWrap = useRef<HTMLDivElement>(null)

  const canSubmit = isDocValid(docType, doc) && password.length === PIN_LEN

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    function hide(e: MouseEvent) {
      if (pinWrap.current && !pinWrap.current.contains(e.target as Node)) {
        setShowKeypad(false)
      }
    }
    document.addEventListener('mousedown', hide)
    return () => document.removeEventListener('mousedown', hide)
  }, [])

  function openKeypad() {
    if (!showKeypad) setDigits(shuffleDigits())
    setShowKeypad(true)
  }

  function addDigit(n: number) {
    setPassword((prev) => (prev.length < PIN_LEN ? `${prev}${n}` : prev))
  }

  return (
    <div className="login-page">
      <header className="login-top">
        <button type="button" className="login-logo" onClick={onHome} aria-label="Sip">
          <SipLogo />
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

            {loading ? (
              <div className="login-loading" role="status" aria-live="polite">
                <span className="login-spinner" aria-hidden />
                <p>Cargando...</p>
              </div>
            ) : done ? (
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
                      onChange={(e) => {
                        const next = e.target.value as (typeof docs)[number]['value']
                        setDocType(next)
                        setDoc((prev) => sanitizeDoc(next, prev))
                      }}
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
                      onChange={(e) => setDoc(sanitizeDoc(docType, e.target.value))}
                      placeholder="Número de documento"
                      inputMode={docType === 'DNI' ? 'numeric' : 'text'}
                      maxLength={docType === 'DNI' ? 8 : 12}
                      autoComplete="off"
                    />
                  </label>
                </div>

                <div className={`login-pin${showKeypad ? ' open' : ''}`} ref={pinWrap}>
                  <label className="login-field">
                    <span className="sr-only">Clave digital</span>
                    <input
                      type="password"
                      value={password}
                      readOnly
                      placeholder="Clave digital"
                      autoComplete="off"
                      onFocus={openKeypad}
                      onClick={openKeypad}
                    />
                  </label>

                  {showKeypad ? (
                    <div className="login-keypad" role="group" aria-label="Teclado de clave digital">
                      {digits.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="login-key"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addDigit(n)}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="login-clear"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setPassword('')}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M16.2 4.3 21 9.1a1.5 1.5 0 0 1 0 2.1l-8.6 8.6H5.2a1.5 1.5 0 0 1-1.5-1.5v-7.2L12 3.2a1.5 1.5 0 0 1 2.1 0l2.1 2.1ZM7.4 18.3h3.8l7.4-7.4-3.8-3.8-7.4 7.4v3.8Zm1.6-2.2 3.2-3.2 1.1 1.1-3.2 3.2H9Z"
                          />
                        </svg>
                        Limpiar
                      </button>
                    </div>
                  ) : null}
                </div>

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
