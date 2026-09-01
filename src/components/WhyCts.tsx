import { whyItems } from '../data'
import { LockIcon, PercentIcon, PhoneIcon } from './Icons'

const icons = {
  phone: <PhoneIcon />,
  percent: <PercentIcon />,
  lock: <LockIcon />,
}

export function WhyCts() {
  return (
    <section className="section" id="por-que">
      <div className="container">
        <h2 className="section-title">¿Por qué elegir nuestra CTS?</h2>
        <div className="why-grid">
          {whyItems.map((item) => (
            <article key={item.title}>
              <div className="why-icon">{icons[item.icon]}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
