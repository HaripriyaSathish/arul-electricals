import { useEffect, useState } from 'react'
import Icon from './Icon'
import { altFor } from './SiteBits'
import { NAV_LINKS } from '../../utils/constants'
import { mediaUrl } from '../../utils/helpers'

export default function Navbar({ settings: s, visible }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('#home')
  const links = NAV_LINKS.filter((l) => visible(l.section))

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      let current = '#home'
      for (const l of links) {
        const el = document.querySelector(l.href)
        if (el && el.getBoundingClientRect().top <= 130) current = l.href
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [links])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container nav__inner">
        <a href="#home" className="brand" onClick={() => setOpen(false)}>
          {s.logo ? <img className="brand__logo" src={mediaUrl(s.logo)} alt={altFor(s.logo, `${s.site_name} logo`)} /> : <span className="brand__logo brand__logo--icon"><Icon name="zap" size={26} /></span>}
          <span className="brand__text">
            <span className="brand__name">
              {s.site_name}
              {s.license_badge && <em>{s.license_badge}</em>}
            </span>
            {s.tagline && <span className="brand__tag gold-text">{s.tagline}</span>}
          </span>
        </a>

        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className={active === l.href ? 'is-active' : ''} onClick={() => setOpen(false)}>{s[`nav_${l.key}`] || l.label}</a>
          ))}
          <a href="#contact" className="btn btn--yellow nav__cta-mobile" onClick={() => setOpen(false)}>
            <Icon name="zap" size={16} />{s.nav_cta_text || 'Request a Consultation'}
          </a>
        </nav>

        <a href="#contact" className="btn btn--yellow nav__cta"><Icon name="zap" size={16} />{s.nav_cta_text || 'Request a Consultation'}</a>
        <button type="button" className="nav__toggle" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          <Icon name={open ? 'x' : 'menu'} size={24} />
        </button>
      </div>
    </header>
  )
}
