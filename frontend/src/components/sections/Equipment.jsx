import Icon from '../common/Icon'
import { SectionHead, ZoomImg } from '../common/SiteBits'

/** Equipment catalog — cards are edited in Admin → Equipment. */
export default function Equipment({ data: d, onEnquire }) {
  const items = (d.items || []).filter((it) => it?.title)
  if (!items.length) return null
  return (
    <section id="equipment" className="section section--white">
      <div className="container">
        <SectionHead eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
        <div className="svc-grid equip-grid">
          {items.map((it, i) => (
            <article className="svc-card equip-card reveal" key={i} style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
              <ZoomImg src={it.image} alt={it.title} customAlt={it.image_alt} className="svc-card__img">
                {it.tag && <span className="img-tag">{it.tag}</span>}
              </ZoomImg>
              <div className="svc-card__body">
                <h3>{it.title}</h3>
                {it.description && <p>{it.description}</p>}
                {it.points?.filter(Boolean).length > 0 && (
                  <ul className="equip-card__points">
                    {it.points.filter(Boolean).map((pt, j) => <li key={j}><Icon name="check-circle" size={16} />{pt}</li>)}
                  </ul>
                )}
                <button type="button" className="btn btn--soft btn--block" onClick={() => onEnquire(it.title)}>
                  {it.button_text || d.button_text || 'Enquire Equipment'}<Icon name="arrow-right" size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
