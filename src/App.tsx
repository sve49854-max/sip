import { useEffect, useState } from 'react'
import { ApplyModal } from './components/ApplyModal'
import { Documents } from './components/Documents'
import { Employers } from './components/Employers'
import { FAQ } from './components/FAQ'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { LoginPage } from './components/LoginPage'
import { Related } from './components/Related'
import { Simulator } from './components/Simulator'
import { WhyCts } from './components/WhyCts'

type ModalMode = 'cts' | 'card' | null

function currentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export default function App() {
  const [path, setPath] = useState(currentPath)
  const [modal, setModal] = useState<ModalMode>(null)

  const go = (next: string) => {
    window.history.pushState({}, '', next)
    setPath(next)
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const onPop = () => setPath(currentPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (path === '/cuenta') {
    return <LoginPage onHome={() => go('/')} />
  }

  return (
    <>
      <Header
        onSolicita={() => setModal('card')}
        onCuenta={() => go('/cuenta')}
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
