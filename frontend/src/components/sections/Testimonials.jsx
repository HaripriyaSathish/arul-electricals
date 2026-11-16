import Icon from '../common/Icon'
import { SectionHead, altFor } from '../common/SiteBits'
import { initials, mediaUrl } from '../../utils/helpers'

export default function Testimonials({ data: d, items }) {
  if (!items.length) return null // design handover: only show genuine testimonials
  return (
    <section id="testimonials" className="section section--light">
      <div className="container">
        <SectionHead eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
        <div className="testi-grid">
          {items.map((t, i) => (
            <figure className="testi reveal" key={t.id} style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
              {t.rating > 0 && (
                <div className="testi__stars" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, n) => <Icon key={n} name="star" size={17} fill={n < t.rating ? 'currentColor' : 'none'} />)}
                </div>
              )}
              <blockquote>“{t.message}”</blockquote>
              <figcaption>
                {t.avatar ? <img src={mediaUrl(t.avatar)} alt={altFor(t.avatar, t.name)} /> : <span className="testi__avatar">{initials(t.name)}</span>}
                <span><b>{t.name}</b><small>{[t.role, t.company].filter(Boolean).join(', ')}</small></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
