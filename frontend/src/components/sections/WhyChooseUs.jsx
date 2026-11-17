import Icon from '../common/Icon'
import { ZoomImg, rich } from '../common/SiteBits'

export default function WhyChooseUs({ data: d, items }) {
  return (
    <section id="why" className="section section--dark why">
      <div className="container">
        <div className="why__head">
          <div className="reveal">
            {d.eyebrow && <span className="eyebrow eyebrow--yellow">{d.eyebrow}</span>}
            <h2>{d.title}</h2>
            {d.subtitle && <p>{rich(d.subtitle)}</p>}
          </div>
          {d.stat_value && (
            <div className="why__stat reveal reveal--right">
              <b>{d.stat_value}</b>
              {d.stat_label && <span>{d.stat_label}</span>}
            </div>
          )}
        </div>

        <div className="why__grid">
          {d.image && (
            <div className="why__photo reveal reveal--left">
              <ZoomImg src={d.image} alt={d.image_title || d.title} customAlt={d.image_alt} className="why__img" />
              {(d.image_title || d.image_text) && (
                <div className="why__caption">
                  <b><Icon name="check-circle" size={18} />{d.image_title}</b>
                  {d.image_text && <p>{rich(d.image_text)}</p>}
                </div>
              )}
            </div>
          )}
          <div className="why__cards">
            {items.map((it, i) => (
              <article className="why__card reveal reveal--zoom" key={it.id} style={{ transitionDelay: `${(i % 2) * 80}ms` }}>
                <span className="icon-tile icon-tile--yellow"><Icon name={it.icon || 'check-circle'} size={20} /></span>
                <h3>{it.title}</h3>
                {it.description && <p>{rich(it.description)}</p>}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
