import Icon from '../common/Icon'
import { linkProps, rich } from '../common/SiteBits'
import { mediaUrl } from '../../utils/helpers'

const iconFor = (link, fallback) => {
  const l = String(link || '').toLowerCase()
  if (l === 'whatsapp' || l.includes('wa.me')) return 'whatsapp'
  if (l === 'call' || l.startsWith('tel:')) return 'phone'
  return fallback
}

export default function CTA({ data: d, settings }) {
  const waSecondary = iconFor(d.secondary_link) === 'whatsapp'
  return (
    <section id="cta" className="cta" style={d.image ? { backgroundImage: `linear-gradient(120deg, rgba(49,0,95,.94), rgba(89,0,168,.86)), url(${mediaUrl(d.image)})` } : undefined}>
      <div className="container cta__inner">
        {d.badge && <span className="hero__badge reveal"><i />{d.badge}</span>}
        <h2 className="reveal reveal--zoom">{d.title}</h2>
        {d.subtitle && <p className="reveal">{rich(d.subtitle)}</p>}
        <div className="hero__actions reveal">
          {d.primary_text && <a className="btn btn--yellow btn--lg" {...linkProps(d.primary_link, settings)}><Icon name={iconFor(d.primary_link, 'zap')} size={18} />{d.primary_text}</a>}
          {d.secondary_text && (
            <a className={`btn btn--lg ${waSecondary ? 'btn--whatsapp' : 'btn--white'}`} {...linkProps(d.secondary_link, settings)}>
              <Icon name={iconFor(d.secondary_link, 'headset')} size={18} />{d.secondary_text}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
