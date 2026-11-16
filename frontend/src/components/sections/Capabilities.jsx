import Icon from '../common/Icon'
import { SectionHead, ZoomImg } from '../common/SiteBits'
import { pad2 } from '../../utils/helpers'

export default function Capabilities({ data: d, items }) {
  if (!items.length) return null
  return (
    <section id="capabilities" className="section section--light">
      <div className="container">
        <SectionHead eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
        <div className="cap-grid">
          {items.map((c, i) => (
            <article className="cap-card reveal reveal--zoom" key={c.id} style={{ transitionDelay: `${(i % 4) * 80}ms` }}>
              <ZoomImg src={c.image} alt={c.title} className="cap-card__img" />
              <div className="cap-card__body">
                <div className="cap-card__top">
                  <span className="icon-tile"><Icon name={c.icon || 'zap'} size={20} /></span>
                  <span className="cap-card__no">{d.card_label || 'Capability'} {pad2(i + 1)}</span>
                </div>
                <h3>{c.title}</h3>
                {c.description && <p>{c.description}</p>}
              </div>
              {c.link_text && <a href="#contact" className="cap-card__foot">{c.link_text}<Icon name="arrow-right" size={15} /></a>}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
