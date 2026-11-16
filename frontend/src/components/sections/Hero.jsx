import { useEffect, useState } from 'react'
import Icon from '../common/Icon'
import { linkProps, altFor } from '../common/SiteBits'
import { mediaUrl } from '../../utils/helpers'

export default function Hero({ data: d, settings }) {
  const slideList = (d.slides || []).filter((s) => s?.image)
  const slides = [...new Set([...slideList.map((s) => s.image), d.image].filter(Boolean))]
  const brighten = new Set(slideList.filter((s) => s.brighten).map((s) => s.image))
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const delay = Math.max(3, Number(d.slide_seconds) || 6) * 1000
  const [loaded, setLoaded] = useState(() => new Set([0]))
  useEffect(() => {
    setLoaded((prev) => (prev.has(index) ? prev : new Set(prev).add(index)))
  }, [index])

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), delay)
    return () => clearInterval(t)
  }, [slides.length, paused, delay])

  const go = (i) => setIndex((i + slides.length) % slides.length)

  return (
    <section id="home" className="hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="hero__slides" role="img" aria-label={altFor(slides[index], d.title)}>
        {slides.length === 0 && <div className="hero__slide is-active" />}
        {slides.map((src, i) => {
          // only download the visible slide and the next one — the rest load when their turn comes
          const needed = i === index || i === (index + 1) % slides.length || loaded.has(i)
          return (
            <div key={src} className={`hero__slide ${i === index ? 'is-active' : ''} ${brighten.has(src) ? 'is-brightened' : ''}`}
              style={needed ? { backgroundImage: `url(${mediaUrl(src)})` } : undefined} />
          )
        })}
      </div>
      <div className="hero__overlay" />

      <div className="container hero__content">
        {d.badge && <span className="hero__badge reveal"><i />{d.badge}</span>}
        <h1 className="reveal">{d.title}</h1>
        {d.subtitle && <p className="hero__sub reveal">{d.subtitle}</p>}
        <div className="hero__actions reveal">
          {d.primary_text && <a className="btn btn--yellow btn--lg" {...linkProps(d.primary_link, settings)}><Icon name="zap" size={18} />{d.primary_text}</a>}
          {d.secondary_text && <a className="btn btn--glass btn--lg" {...linkProps(d.secondary_link, settings)}>{d.secondary_text}<Icon name="arrow-right" size={18} /></a>}
        </div>
        {d.features?.length > 0 && (
          <div className="hero__chips">
            {d.features.filter((f) => f.text).map((f, i) => (
              <div className="hero__chip reveal" key={i} style={{ transitionDelay: `${i * 90}ms` }}>
                <span><Icon name={f.icon || 'zap'} size={18} /></span>{f.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button type="button" className="hero__arrow hero__arrow--prev" onClick={() => go(index - 1)} aria-label="Previous image"><Icon name="chevron-left" size={22} /></button>
          <button type="button" className="hero__arrow hero__arrow--next" onClick={() => go(index + 1)} aria-label="Next image"><Icon name="chevron-right" size={22} /></button>
          <div className="hero__dots">
            {slides.map((s, i) => (
              <button key={s} type="button" className={i === index ? 'is-active' : ''} onClick={() => go(i)} aria-label={`Show image ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
