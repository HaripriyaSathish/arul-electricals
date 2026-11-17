import { useMemo, useState } from 'react'
import Icon from '../common/Icon'
import { SectionHead, ZoomImg, useReveal, rich } from '../common/SiteBits'

export default function Projects({ data: d, items, onEnquire }) {
  const [filter, setFilter] = useState('all')
  const categories = useMemo(() => [...new Set(items.map((p) => p.category).filter(Boolean))], [items])
  const shown = filter === 'all' ? items : items.filter((p) => p.category === filter)
  useReveal([filter])

  if (!items.length) return null
  return (
    <section id="projects" className="section section--light">
      <div className="container">
        <SectionHead eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
        {categories.length > 1 && (
          <div className="filters reveal" role="tablist">
            <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>{d.all_label || 'All'}</button>
            {categories.map((c) => (
              <button type="button" key={c} className={filter === c ? 'is-active' : ''} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
        )}
        <div className="proj-grid">
          {shown.map((p) => (
            <article key={p.id} className={`proj-card reveal reveal--zoom ${p.is_featured ? 'proj-card--featured' : ''}`}>
              <ZoomImg src={p.image} alt={p.title} customAlt={p.image_alt} className="proj-card__img">
                {p.tag && <span className="img-tag">{p.tag}</span>}
                {p.is_illustrative && <span className="proj-card__note">{d.illustrative_label || 'Illustrative image'}</span>}
              </ZoomImg>
              <div className="proj-card__body">
                {p.client && <span className="proj-card__client">{p.client}</span>}
                <h3>{p.title}</h3>
                {p.description && <p>{rich(p.description)}</p>}
                {p.link_text && (
                  <button type="button" className="proj-card__link" onClick={() => onEnquire(p.title)}>{p.link_text}<Icon name="arrow-right" size={15} /></button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
