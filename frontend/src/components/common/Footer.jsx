import { useEffect, useState } from 'react'
import Icon from './Icon'
import { altFor } from './SiteBits'
import { FOOTER_QUICK_LINKS } from '../../utils/constants'
import { mediaUrl, telHref, whatsappHref } from '../../utils/helpers'

/** Renders simple text: "## " headings, "- " bullets, blank line = new paragraph. */
function RichText({ text = '' }) {
  const blocks = []
  let list = null
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    if (line.startsWith('- ')) {
      if (!list) { list = []; blocks.push({ type: 'ul', items: list, key: i }) }
      list.push(line.slice(2))
      return
    }
    list = null
    if (!line) return
    if (line.startsWith('## ')) blocks.push({ type: 'h', text: line.slice(3), key: i })
    else blocks.push({ type: 'p', text: line, key: i })
  })
  return blocks.map((b) => b.type === 'ul'
    ? <ul key={b.key}>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
    : b.type === 'h' ? <h4 key={b.key}>{b.text}</h4> : <p key={b.key}>{b.text}</p>)
}

function LegalModal({ page, onClose }) {
  useEffect(() => {
    if (!page) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [page, onClose])
  if (!page) return null
  return (
    <div className="legal" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true" aria-label={page.title}>
      <div className="legal__card">
        <header className="legal__head">
          <span className="icon-tile icon-tile--yellow"><Icon name={page.icon} size={20} /></span>
          <h3>{page.title}</h3>
          <button type="button" onClick={onClose} aria-label="Close"><Icon name="x" size={22} /></button>
        </header>
        <div className="legal__body"><RichText text={page.text} /></div>
        <footer className="legal__foot"><button type="button" className="btn btn--primary" onClick={onClose}>Close</button></footer>
      </div>
    </div>
  )
}

/** Figma "Connect with us" icons, always shown. Each opens its link from Site Settings (falls back to the enquiry form). */
const SOCIALS = [
  { key: "linkedin", icon: "briefcase", label: "LinkedIn" },
  { key: "whatsapp", icon: "message-text", label: "WhatsApp chat" },
  { key: "youtube", icon: "circle-play", label: "YouTube" },
  { key: "email", icon: "mail", label: "Email" },
]

const socialHref = (k, s) => {
  if (k === "whatsapp") return s.whatsapp ? whatsappHref(s.whatsapp, s.whatsapp_message) : ""
  if (k === "email") return s.email ? `mailto:${s.email}` : ""
  return s[k] || ""
}

export default function Footer({ settings: s, services = [], visible, legal = {} }) {
  const [openPage, setOpenPage] = useState(null)
  const quickLinks = FOOTER_QUICK_LINKS.filter((l) => visible(l.section))
  const serviceLinks = (s.footer_services?.filter(Boolean).length ? s.footer_services.filter(Boolean) : services.map((sv) => sv.title))
  const equipmentLinks = (s.footer_equipment || []).filter(Boolean)
  const legalPages = [
    { key: "privacy", title: legal.privacy_title || "Privacy Policy", text: legal.privacy, icon: "lock" },
    { key: "terms", title: legal.terms_title || "Terms of Service", text: legal.terms, icon: "file-text" },
    { key: "statutory", title: legal.statutory_title || "Statutory Approvals", text: legal.statutory, icon: "shield-check" },
  ].filter((p) => p.text)

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            {s.logo ? <img className="footer__logo" src={mediaUrl(s.logo)} alt={altFor(s.logo, `${s.site_name} logo`)} /> : <span className="footer__logo footer__logo--icon"><Icon name="zap" size={24} /></span>}
            <div>
              <b>{s.site_name}{s.footer_badge && <em>{s.footer_badge}</em>}</b>
              {s.footer_tagline && <span className="gold-text">{s.footer_tagline}</span>}
            </div>
          </div>
          <div className="footer__top-actions">
            {s.phone && (
              <a className="footer__hotline" href={telHref(s.phone)}>
                <span><Icon name="asterisk" size={18} strokeWidth={2.6} /></span>
                <div><small>{s.hotline_label || "Call us"}</small><b>{s.phone}</b></div>
              </a>
            )}
            <a className="btn btn--yellow" href="#contact"><Icon name="clock" size={17} />{s.footer_button_text || s.nav_cta_text || "Request a Consultation"}</a>
          </div>
        </div>

        <div className="footer__cols">
          <div className="footer__about">
            <h5>{s.footer_about_title || `About ${s.site_name}`}</h5>
            {s.footer_about && <p>{s.footer_about}</p>}
            {s.certifications?.length > 0 && (
              <div className="footer__certs">
                {s.certifications.filter(Boolean).map((c) => <span key={c}><Icon name="shield-check" size={14} />{c}</span>)}
              </div>
            )}
            <span className="footer__social-title">{s.social_title || "Connect with us"}</span>
            <div className="footer__social">
              {SOCIALS.map((so) => {
                const href = socialHref(so.key, s)
                const external = href && !href.startsWith("mailto:")
                return (
                  <a key={so.key} href={href || "#contact"} aria-label={so.label} title={so.label}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    <Icon name={so.icon} size={18} />
                  </a>
                )
              })}
            </div>
          </div>

          {serviceLinks.length > 0 && (
            <div>
              <h5>{s.footer_services_title || "Our Services"}</h5>
              <ul className="footer__dots">{serviceLinks.map((t, i) => <li key={i}><a href="#services"><i className="footer__dot" />{t}</a></li>)}</ul>
            </div>
          )}

          {equipmentLinks.length > 0 && (
            <div>
              <h5>{s.footer_equipment_title || "Power Equipment"}</h5>
              <ul className="footer__dots">{equipmentLinks.map((t, i) => <li key={i}><a href={visible("equipment") ? "#equipment" : "#services"}><i className="footer__dot" />{t}</a></li>)}</ul>
            </div>
          )}

          <div>
            <h5>{s.footer_links_title || "Quick Links"}</h5>
            <ul>{quickLinks.map((l) => <li key={l.href}><a href={l.href}><Icon name="chevron-right" size={14} />{s[`quick_${l.key}`] || l.label}</a></li>)}</ul>
          </div>

          <div className="footer__contact">
            <h5>{s.footer_contact_title || "Contact Us"}</h5>
            <ul>
              {s.address && <li><Icon name="map-pin" size={17} /><span>{s.address}</span></li>}
              {s.phone && <li><Icon name="phone" size={17} /><a href={telHref(s.phone)}>{s.phone}</a></li>}
              {s.email && <li><Icon name="mail" size={17} /><a href={`mailto:${s.email}`}>{s.email}</a></li>}
              {s.hours && <li><Icon name="clock" size={17} /><span>{s.hours}</span></li>}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__bottom-left">
            <span>{s.copyright}</span>
            {s.legal_line && <small>{s.legal_line}</small>}
          </div>
          {legalPages.length > 0 && (
            <nav className="footer__legal" aria-label="Legal">
              {legalPages.map((p) => <button key={p.key} type="button" onClick={() => setOpenPage(p)}>{p.title}</button>)}
            </nav>
          )}
        </div>
        {legal.credit_text && (
          <div className="footer__credit">
            {legal.credit_url
              ? <a href={legal.credit_url} target="_blank" rel="noopener noreferrer">{legal.credit_text}<Icon name="external-link" size={13} /></a>
              : legal.credit_text}
          </div>
        )}
      </div>
      <LegalModal page={openPage} onClose={() => setOpenPage(null)} />
    </footer>
  )
}
