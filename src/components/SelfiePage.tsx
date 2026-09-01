import { useEffect, useRef, useState } from 'react'
import { SipLogo } from './Icons'

type SelfiePageProps = {
  onHome: () => void
}

export function SelfiePage({ onHome }: SelfiePageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState('')

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
    setPhoto(canvas.toDataURL('image/jpeg', 0.92))
  }

  function retake() {
    setPhoto('')
  }

  return (
    <div className="login-page selfie-page">
      <header className="login-top">
        <button type="button" className="login-logo" onClick={onHome} aria-label="Sip">
          <SipLogo />
        </button>
      </header>

      <div className="selfie-body">
        <h2>Validación facial</h2>
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
            <button type="button" className="login-submit ready" onClick={onHome}>
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
