import { related } from '../data'

export function Related() {
  return (
    <section className="section" id="interes" style={{ paddingTop: 12 }}>
      <div className="container">
        <h2 className="section-title" style={{ textAlign: 'left' }}>
          Te podría interesar
        </h2>
        <div className="related-row">
          {related.map((item) => (
            <article className="product-card" key={item.title}>
              <div className="product-art">
                <img src={item.image} alt="" />
                {item.tag ? <span className="tag">{item.tag}</span> : null}
              </div>
              <div className="body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <div className="links">
                  <a href="#hero">¡Lo quiero!</a>
                  <a href="#docs">Descubre más</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
