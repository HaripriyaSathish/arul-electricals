import Icon from '../common/Icon'
import { ZoomImg, highlight, linkProps } from '../common/SiteBits'

export default function About({ data: d, siteName }) {
  return (
    <section id="about" className="section section--dark about">
      <div className="container about__grid">
        <div className="about__media reveal reveal--left">
          <ZoomImg src={d.image} alt={d.title} customAlt={d.image_alt} className="about__img" />
          {d.since_year && (
            <div className="about__since">
              {d.since_prefix && <small>{d.since_prefix}</small>}
              <b>{d.since_year}</b>
              {d.since_label && <span>{d.since_label}</span>}
            </div>
          )}
          {(d.badge_title || d.badge_text) && (
            <div className="about__badge">
              <span className="icon-tile icon-tile--yellow"><Icon name="shield-check" size={20} /></span>
              {d.badge_title && <h4>{d.badge_title}</h4>}
              {d.badge_text && <p>{d.badge_text}</p>}
              {d.badge_label && <span className="about__badge-tag">{d.badge_label}</span>}
            </div>
          )}
        </div>

        <div className="about__content reveal-group--right">
          {d.eyebrow && <span className="eyebrow eyebrow--yellow reveal">{d.eyebrow}</span>}
          <h2 className="reveal">{d.title}</h2>
          {/* an empty line in the admin text starts a new paragraph */}
          {String(d.description || '').split(/\n\s*\n/).map((para) => para.trim()).filter(Boolean).map((para, i) => (
            <p key={i} className="about__lead reveal">{highlight(para, siteName)}</p>
          ))}
          {d.points?.length > 0 && (
            <ul className="about__points">
              {d.points.filter((p) => p.title || p.text).map((p, i) => (
                <li key={i} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                  <Icon name="check-circle" size={22} />
                  <div><b>{p.title}</b>{p.text && <p>{p.text}</p>}</div>
                </li>
              ))}
            </ul>
          )}
          {d.button_text && (
            <a className="btn btn--yellow reveal" {...linkProps(d.button_link)}>{d.button_text}<Icon name="calendar" size={17} /></a>
          )}
        </div>
      </div>
    </section>
  )
}
