import { documents } from '../data'
import { DownloadIcon } from './Icons'

export function Documents() {
  return (
    <section className="section" id="docs">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: 'left' }}>
          Todo lo que debes de saber
        </h2>
        <div className="tabs">
          <button type="button">Documentación de la cuenta CTS</button>
        </div>
        <div className="docs-list">
          {documents.map((doc) => (
            <a key={doc} className="doc-link" href="#docs">
              <span className="doc-icon">
                <DownloadIcon />
              </span>
              {doc}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
