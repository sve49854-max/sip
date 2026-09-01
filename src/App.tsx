import { useState } from 'react'
import { ApplyModal } from './components/ApplyModal'
import { Documents } from './components/Documents'
import { Employers } from './components/Employers'
import { FAQ } from './components/FAQ'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Related } from './components/Related'
import { Simulator } from './components/Simulator'
import { WhyCts } from './components/WhyCts'

type ModalMode = 'cts' | 'card' | 'login' | null

export default function App() {
  const [modal, setModal] = useState<ModalMode>(null)

  return (
    <>
      <Header
        onSolicita={() => setModal('card')}
        onCuenta={() => setModal('login')}
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
