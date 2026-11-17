/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react'
import { mediaUrl, telHref, whatsappHref } from '../../utils/helpers'

/** Section heading block: eyebrow + title + subtitle */
export function SectionHead({ eyebrow, title, subtitle, light = false, align = 'center' }) {
  if (!eyebrow && !title && !subtitle) return null
  return (
    <div className={`s-head s-head--${align} ${light ? 's-head--light' : ''} reveal`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}

/** Alt text for images, keyed by media path (managed in Admin → Media Library). */
let ALT_MAP = {}
export const setAltMap = (map) => { ALT_MAP = map || {} }
export const altFor = (src, fallback = '') => ALT_MAP[src] || fallback

/** Image that zooms in gently when scrolled into view and on hover. */
export function ZoomImg({ src, alt = '', customAlt = '', className = '', children, eager = false }) {
  if (!src) return <div className={`zimg zimg--empty ${className}`}>{children}</div>
  return (
    <div className={`zimg reveal-img ${className}`}>
      {/* customAlt = alt text typed on this card (wins), else the image's alt from the Media Library */}
      <img src={mediaUrl(src)} alt={customAlt || altFor(src, alt)} loading={eager ? 'eager' : 'lazy'} decoding="async"
        onLoad={(e) => e.currentTarget.parentElement?.classList.add('is-loaded')}
        onError={(e) => e.currentTarget.parentElement?.classList.add('is-loaded')} />
      {children}
    </div>
  )
}

/** Adds .is-in to .reveal / .reveal-img elements as they scroll into view. */
export function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.is-in), .reveal-img:not(.is-in)')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target
          el.classList.add('is-in')
          io.unobserve(el)
          // after the staggered entrance, remove the delay so hover effects respond instantly
          const delay = parseFloat(el.style.transitionDelay) || 0
          if (delay) setTimeout(() => { el.style.transitionDelay = '' }, delay + 900)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * Internal links (#section) scroll smoothly; external links open in a new tab.
 * Special values: "whatsapp" → WhatsApp chat with the ready-made message, "call" → phone dialer
 * (numbers come from Site Settings).
 */
export function linkProps(href, settings = {}) {
  if (!href) return { href: '#contact' }
  const key = String(href).trim().toLowerCase()
  if (key === 'whatsapp' && settings.whatsapp) {
    return { href: whatsappHref(settings.whatsapp, settings.whatsapp_message), target: '_blank', rel: 'noreferrer' }
  }
  if (key === 'call' && settings.phone) return { href: telHref(settings.phone) }
  if (/^https?:/i.test(href)) return { href, target: '_blank', rel: 'noreferrer' }
  return { href }
}

/** Wraps every occurrence of `word` in a highlight span. */
export function highlight(text = '', word = '') {
  if (!word || !text.includes(word)) return text
  const parts = text.split(word)
  return parts.flatMap((p, i) => (i < parts.length - 1 ? [p, <span key={i} className="hl">{word}</span>] : [p]))
}
