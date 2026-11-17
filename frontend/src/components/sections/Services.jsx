import Icon from '../common/Icon'
import { SectionHead, ZoomImg, rich } from '../common/SiteBits'
import { pad2 } from '../../utils/helpers'

export default function Services({ data: d, items, onEnquire }) {
  if (!items.length) return null
  return (
    <section id="services" className="section section--light">
      <div className="container">
        <SectionHead eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
        <div className="svc-grid">
          {items.map((s, i) => (
            <article className="svc-card reveal" key={s.id} style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
              <ZoomImg src={s.image} alt={s.title} customAlt={s.image_alt} className="svc-card__img">
                {s.tag && <span className="img-tag">{s.tag}</span>}
              </ZoomImg>
              <div className="svc-card__body">
                <span className="svc-card__no"><Icon name={s.icon || 'zap'} size={15} />{pad2(i + 1)} / {d.card_label || 'Service'}</span>
                <h3>{s.title}</h3>
                {s.description && <p>{rich(s.description)}</p>}
                <button type="button" className="btn btn--soft btn--block" onClick={() => onEnquire(s.title)}>
                  {s.button_text || 'Enquire Now'}<Icon name="arrow-right" size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
