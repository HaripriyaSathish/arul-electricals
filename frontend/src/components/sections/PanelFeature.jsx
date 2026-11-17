import Icon from '../common/Icon'
import { ZoomImg, linkProps } from '../common/SiteBits'

export default function PanelFeature({ data: d }) {
  return (
    <section id="panel-feature" className="section section--white">
      <div className="container feature">
        <div className="feature__media reveal reveal--left">
          <ZoomImg src={d.image} alt={d.title} customAlt={d.image_alt} className="feature__img" />
          {d.stamp_text && <span className="feature__stamp"><Icon name="cpu" size={22} />{d.stamp_text}</span>}
        </div>
        <div className="feature__content reveal-group--right">
          {d.eyebrow && <span className="eyebrow reveal">{d.eyebrow}</span>}
          <h2 className="reveal">{d.title}</h2>
          {d.description && <p className="reveal">{d.description}</p>}
          {d.points?.length > 0 && (
            <ul className="feature__points">
              {d.points.filter(Boolean).map((p, i) => (
                <li key={i} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}><Icon name="check" size={16} strokeWidth={3} />{p}</li>
              ))}
            </ul>
          )}
          {d.button_text && <a className="btn btn--primary reveal" {...linkProps(d.button_link)}>{d.button_text}<Icon name="arrow-right" size={17} /></a>}
        </div>
      </div>
    </section>
  )
}
