import { ArrowIcon } from './Icons'

type HeroProps = {
  onWant: () => void
}

export function Hero({ onWant }: HeroProps) {
  return (
    <section id="hero">
      <div className="container crumbs">
        <ol>
          <li>
            <a href="#hero">Inicio</a>
          </li>
          <li>
            <a href="#productos">Productos</a>
          </li>
          <li>Cuenta CTS</li>
        </ol>
      </div>

      <div className="container hero">
        <div>
          <h1>Abre tu cuenta CTS con nuestra súper tasa de interés</h1>
          <p>
            Traslada tu CTS a Sip y obtén lo mejor por tu esfuerzo, con el
            respaldo del Grupo Intercorp
          </p>
          <button type="button" className="btn btn-blue" onClick={onWant}>
            <ArrowIcon />
            Lo quiero
          </button>
        </div>

        <div className="hero-visual">
          <picture className="hero-circle">
            <source media="(max-width: 980px)" srcSet="/hero-cts-mobile.png" />
            <img src="/hero-cts.png" alt="Cliente Sip con su tarjeta y laptop" />
          </picture>
        </div>
      </div>

      <a className="scroll-hint" href="#por-que" aria-label="Ver beneficios">
        <span />
      </a>
    </section>
  )
}
