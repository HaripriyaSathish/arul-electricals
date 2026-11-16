import Icon from '../common/Icon'
import { SectionHead } from '../common/SiteBits'
import { pad2 } from '../../utils/helpers'

export default function Process({ data: d, items }) {
  if (!items.length) return null
  return (
    <section id="process" className="section section--dark process">
      <div className="container">
        <SectionHead eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} light />
        <ol className="timeline" style={{ '--steps': items.length }}>
          {items.map((s, i) => (
            <li key={s.id} className={`timeline__step ${i % 2 ? 'is-down' : 'is-up'} reveal`} style={{ transitionDelay: `${i * 380}ms` }}>
              <div className="timeline__card">
                <div className="timeline__top">
                  <span className="timeline__icon"><Icon name={s.icon || 'check-circle'} size={20} /></span>
                  <span className="timeline__num">{pad2(i + 1)}</span>
                </div>
                <h3>{s.title}</h3>
                {s.description && <p>{s.description}</p>}
                {s.phase && <span className="timeline__phase">{d.phase_label || 'Phase'}: {s.phase}</span>}
              </div>
              <span className="timeline__dot">{pad2(i + 1)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
