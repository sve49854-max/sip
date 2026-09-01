import { useState } from 'react'
import { navItems, partners } from '../data'

type HeaderProps = {
  onSolicita: () => void
  onCuenta: () => void
}

export function Header({ onSolicita, onCuenta }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  return (
    <header>
      <div className="partners">
        <div className="container partners-inner">
          {partners.map((name, i) => (
            <span key={name}>
              {i > 0 ? (
                <span className="sep" aria-hidden>
                  |
                </span>
              ) : null}
              <a href="#footer">{name}</a>
            </span>
          ))}
        </div>
      </div>

      <nav className="navbar">
        <div className={`container navbar-inner${open ? ' open' : ''}`}>
          <a className="logo" href="#hero" aria-label="Sip">
            <img src="/logo-sip.svg" width={60} height={40} alt="" />
          </a>

          <div className="nav-links">
            {navItems.map((item) => (
              <div
                className={`nav-item${openMenu === item.label ? ' open' : ''}`}
                key={item.label}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenMenu(openMenu === item.label ? null : item.label)
                  }
                >
                  {item.label}
                  <span className="chevron" />
                </button>
                <div className="dropdown">
                  {item.children.map((child) => (
                    <a
                      key={child.label}
                      href={child.href}
                      onClick={() => setOpen(false)}
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <div className="nav-item">
              <a href="#faq">Blog</a>
            </div>
          </div>

          <div className="nav-actions">
            <button type="button" className="btn btn-white" onClick={onSolicita}>
              Solicita tu Tarjeta Sip
            </button>
            <button type="button" className="btn btn-ink" onClick={onCuenta}>
              Mi cuenta
            </button>
          </div>

          <button
            type="button"
            className="menu-toggle"
            aria-label="Abrir menú"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <path d="M1 1h20M1 8h20M1 15h20" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  )
}
