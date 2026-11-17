import { useState } from 'react'
import Icon from '../common/Icon'
import { linkProps } from '../common/SiteBits'

/** Frequently asked questions — edited in Admin → FAQ. Also published to Google as FAQ structured data (see Home.jsx). */
export default function FAQ({ data: d, settings }) {
  const items = (d.items || []).filter((q) => q?.question && q?.answer)
  const [open, setOpen] = useState(0)
  if (!items.length) return null
  return (
    <section id="faq" className="section section--light">
      <div className="container faq">
        <div className="faq__intro reveal">
          {d.eyebrow && <span className="eyebrow">{d.eyebrow}</span>}
          {d.title && <h2>{d.title}</h2>}
          {d.subtitle && <p>{d.subtitle}</p>}
          {d.button_text && (
            <a className="btn btn--primary" {...linkProps(d.button_link || '#contact', settings)}>{d.button_text}<Icon name="arrow-right" size={17} /></a>
          )}
        </div>
        <div className="faq__list">
          {items.map((q, i) => {
            const isOpen = open === i
            return (
              <div className={`faq__item reveal ${isOpen ? 'is-open' : ''}`} key={i} style={{ transitionDelay: `${i * 60}ms` }}>
                <h3>
                  <button type="button" aria-expanded={isOpen} aria-controls={`faq-a-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                    <span>{q.question}</span>
                    <Icon name="chevron-down" size={20} />
                  </button>
                </h3>
                <div className="faq__answer" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                  <div><p>{q.answer}</p></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
