import { useState } from 'react'
import { faqs } from '../data'

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="faq-wrap">
          <div>
            <h2 className="section-title">Preguntas frecuentes</h2>
            <p className="section-sub">
              Revisa lo más importante que tienes que saber sobre tu cuenta CTS
            </p>
          </div>
          <a className="btn btn-blue small" href="#faq">
            Ir al Centro de Ayuda
          </a>
        </div>

        <div className="faq-list">
          {faqs.map((item, index) => {
            const isOpen = open === index
            return (
              <div className="faq-item" key={item.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  {item.q}
                  <span className="faq-plus">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? <p>{item.a}</p> : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
