import { useMemo, useState } from 'react'
import { TREA } from '../data'

function money(value: number) {
  return value.toLocaleString('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 2,
  })
}

export function Simulator() {
  const [raw, setRaw] = useState('10000')
  const [show, setShow] = useState(false)

  const amount = Number(raw.replace(/[^\d.]/g, '')) || 0

  const result = useMemo(() => {
    const yearly = amount * TREA
    return {
      yearly,
      total: amount + yearly,
      semester: yearly / 2,
    }
  }, [amount])

  return (
    <section className="section" id="simular">
      <div className="container simulator">
        <h2 className="section-title">Simula cuánto ganarás</h2>
        <p className="section-sub">Ingresa el monto que depositarás</p>

        <form
          className="sim-card"
          onSubmit={(e) => {
            e.preventDefault()
            setShow(true)
          }}
        >
          <h3>Simula tu CTS (TREA: 6.5%)</h3>
          <p>Ingresa el monto que depositarás</p>
          <label className="field">
            <span>S/</span>
            <input
              inputMode="decimal"
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value)
                setShow(false)
              }}
              aria-label="Monto a depositar"
            />
          </label>
          <button
            type="submit"
            className="btn btn-blue"
            onClick={() => setShow(true)}
          >
            Simular ahora
          </button>
          <small className="sim-note">*Montos referenciales.</small>

          {show ? (
            <div className="sim-result">
              <div>
                <span>Intereses a 6 meses</span>
                <strong>{money(result.semester)}</strong>
              </div>
              <div>
                <span>Intereses a 12 meses</span>
                <strong>{money(result.yearly)}</strong>
              </div>
              <div>
                <span>Total proyectado</span>
                <strong>{money(result.total)}</strong>
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  )
}
