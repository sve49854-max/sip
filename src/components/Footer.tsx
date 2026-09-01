export function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="app-cta" id="app">
        <div className="container app-cta-inner">
          <div>
            <h3>Descarga la app Sip</h3>
            <p>Consultas y operaciones sin salir de casa</p>
          </div>
          <div className="store-links">
            <a href="#app">Para android</a>
            <a href="#app">Para iOS</a>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>Nosotros</h3>
            <ul>
              <li>
                <a href="#footer">¿Quiénes somos?</a>
              </li>
              <li>
                <a href="#footer">Grupo Intercorp</a>
              </li>
              <li>
                <a href="#footer">Infinance XP</a>
              </li>
              <li>
                <a href="#footer">Nuestro propósito</a>
              </li>
              <li>
                <a href="#footer">Orgullo Sip</a>
              </li>
              <li>
                <a href="#footer">Únete al equipo Sip</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Somos transparentes</h3>
            <ul>
              <li>
                <a href="#docs">Documentos relevantes</a>
              </li>
              <li>
                <a href="#docs">Estados financieros</a>
              </li>
              <li>
                <a href="#footer">Buen gobierno</a>
              </li>
              <li>
                <a href="#footer">Información www.gob.pe/SMV</a>
              </li>
              <li>
                <a href="#faq">Reclamos</a>
              </li>
              <li>
                <a href="#footer">Protección de datos</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Servicio al cliente</h3>
            <ul>
              <li>
                <a href="#faq">Libro de reclamaciones</a>
              </li>
              <li>
                <a href="#footer">Superintendencia de Banca y Seguros</a>
              </li>
              <li>
                <a href="#docs">Términos y condiciones de canales digitales</a>
              </li>
              <li>
                <a href="#faq">Nuestro Blog</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Contacto</h3>
            <p style={{ color: 'var(--sip-muted)', marginTop: 0 }}>
              Para consultas y reclamos comunícate con nuestro call center de
              lunes a sábado de 9am a 9pm.
            </p>
            <ul>
              <li>WhatsApp +51 989 157 775</li>
              <li>Lima (01) 619 4800</li>
              <li>Provincias 0801 00002</li>
            </ul>
          </div>
        </div>
        <div className="footer-legal">
          <span>Infinance XP S.A. RUC: 20522291201</span>
          <span>© Todos los derechos reservados</span>
        </div>
      </div>
    </footer>
  )
}
