import { useEffect, useState } from 'react'
import Icon from '../common/Icon'
import { PublicAPI } from '../../api/endpoints'
import { errorMessage, fieldErrors } from '../../api/axiosInstance'
import { telHref } from '../../utils/helpers'

const EMPTY = { name: '', company: '', phone: '', email: '', voltage: '', equipment: '', location: '', message: '', website: '' }

export default function Contact({ data: d, settings: s, preset }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  // "Enquire Now" on a service/project pre-fills the requirement
  useEffect(() => {
    if (!preset?.text) return
    setForm((f) => ({ ...f, message: f.message || `I would like to enquire about: ${preset.text}` }))
  }, [preset])

  // Strict input filters: name = letters & spaces only, mobile = digits only (max 10)
  const FILTERS = {
    name: (v) => v.replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ').slice(0, 60),
    phone: (v) => v.replace(/\D/g, '').slice(0, 10),
  }
  const HINTS = { name: 'Only letters and spaces are allowed.', phone: 'Only numbers are allowed.' }

  const set = (k) => (e) => {
    const raw = e.target.value
    const value = FILTERS[k] ? FILTERS[k](raw) : raw
    setForm((f) => ({ ...f, [k]: value }))
    // show a hint only when a disallowed character was typed (not when the 10-digit limit is reached)
    const blocked = FILTERS[k] && (k === 'phone' ? /\D/.test(raw) : /[^A-Za-z\s]/.test(raw))
    setErrors((errs) => ({ ...errs, [k]: blocked ? HINTS[k] : undefined }))
  }

  const validate = () => {
    const e = {}
    const name = form.name.trim()
    if (!name) e.name = 'Please enter your name.'
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) e.name = 'Name can contain only letters and spaces.'
    else if (name.replace(/\s/g, '').length < 2) e.name = 'Please enter your full name.'
    if (!form.phone) e.phone = 'Please enter your mobile number.'
    else if (!/^\d+$/.test(form.phone)) e.phone = 'Mobile number can contain only numbers.'
    else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9).'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = 'Enter a valid email address.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setStatus({ state: 'sending', message: '' })
    try {
      const res = await PublicAPI.contact(form)
      setStatus({ state: 'sent', message: d.success_message || res.message })
      setForm(EMPTY)
    } catch (err) {
      setErrors(fieldErrors(err))
      setStatus({ state: 'error', message: errorMessage(err, 'Could not send your enquiry. Please call us instead.') })
    }
  }

  const mapQ = s.map_query || s.address
  const info = [
    s.address && { icon: 'map-pin', title: d.address_label || 'Office address', lines: [s.address], link: mapQ && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`, linkText: d.directions_text || 'Get directions' },
    s.phone && { icon: 'phone', title: d.phone_label || 'Call us', lines: [s.phone, s.phone_alt].filter(Boolean), link: telHref(s.phone), linkText: d.call_text || 'Call now' },
    s.email && { icon: 'mail', title: d.email_label || 'Email', lines: [s.email], link: `mailto:${s.email}`, linkText: d.email_text || 'Send email' },
    s.hours && { icon: 'clock', title: d.hours_label || 'Working hours', lines: [s.hours] },
  ].filter(Boolean)

  const field = (k, label, props = {}) => (
    <label className={`form-field ${props.full ? 'is-full' : ''} ${errors[k] ? 'has-error' : ''}`}>
      <span>{label}{props.required && <em>*</em>}</span>
      {props.as === 'select' ? (
        <select value={form[k]} onChange={set(k)}>
          <option value="">{d.select_placeholder || 'Select…'}</option>
          {(props.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : props.as === 'textarea' ? (
        <textarea rows={4} value={form[k]} onChange={set(k)} placeholder={props.placeholder} />
      ) : (
        <input type={props.type || 'text'} value={form[k]} onChange={set(k)} placeholder={props.placeholder} autoComplete={props.autoComplete} inputMode={props.inputMode} maxLength={props.maxLength} aria-invalid={!!errors[k]} />
      )}
      {errors[k] && <small>{errors[k]}</small>}
    </label>
  )

  return (
    <section id="contact" className="section section--light contact">
      <div className="container contact__grid">
        <div className="contact__info">
          {d.eyebrow && <span className="eyebrow reveal">{d.eyebrow}</span>}
          <h2 className="reveal">{d.title}</h2>
          {d.subtitle && <p className="contact__sub reveal">{d.subtitle}</p>}

          <div className="contact__cards">
            {info.map((c) => (
              <div className="info-card reveal reveal--left" key={c.title}>
                <span className="icon-tile"><Icon name={c.icon} size={20} /></span>
                <div>
                  <h4>{c.title}</h4>
                  {c.lines.map((l) => <p key={l}>{l}</p>)}
                  {c.link && <a href={c.link} target={c.link.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{c.linkText}<Icon name="arrow-right" size={14} /></a>}
                </div>
              </div>
            ))}
            {d.emergency_title && (
              <div className="info-card info-card--dark reveal reveal--left">
                <span className="icon-tile icon-tile--yellow"><Icon name="alert" size={20} /></span>
                <div><h4>{d.emergency_title}</h4>{d.emergency_text && <p>{d.emergency_text}</p>}</div>
              </div>
            )}
          </div>
        </div>

        <div className="form-card reveal reveal--right">
          {status.state === 'sent' ? (
            <div className="form-success">
              <span><Icon name="check" size={34} strokeWidth={3} /></span>
              <h3>{d.success_title || 'Enquiry sent!'}</h3>
              <p>{status.message}</p>
              <button type="button" className="btn btn--soft" onClick={() => setStatus({ state: 'idle', message: '' })}>{d.again_text || 'Send another enquiry'}</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h3>{d.form_title || 'Project Enquiry'}</h3>
              {d.form_subtitle && <p className="form-card__sub">{d.form_subtitle}</p>}
              <div className="form-grid">
                {field('name', d.label_name || 'Full Name', { required: true, placeholder: 'e.g. Ramesh Kumar', autoComplete: 'name' })}
                {field('company', d.label_company || 'Company / Organization', { placeholder: 'e.g. Acme Industries', autoComplete: 'organization' })}
                {field('phone', d.label_phone || 'Mobile Number', { required: true, type: 'tel', inputMode: 'numeric', placeholder: '10-digit mobile number', autoComplete: 'tel-national' })}
                {field('email', d.label_email || 'Email Address', { type: 'email', placeholder: 'name@company.com', autoComplete: 'email' })}
                {field('voltage', d.label_voltage || 'Voltage Requirement', { as: 'select', options: d.voltage_options })}
                {field('equipment', d.label_equipment || 'Equipment Requirement', { as: 'select', options: d.equipment_options })}
                {field('location', d.label_location || 'Project Site Location', { full: true, placeholder: 'e.g. SIPCOT Industrial Area, Hosur' })}
                {field('message', d.label_message || 'Project Scope / Technical Requirements', { full: true, as: 'textarea', placeholder: 'Describe the load, timeline, and scope of work…' })}
                <input type="text" className="hp" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />
              </div>
              {status.state === 'error' && <div className="form-error"><Icon name="alert" size={16} />{status.message}</div>}
              <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={status.state === 'sending'}>
                {status.state === 'sending' ? <><span className="btn-spinner" />Sending…</> : <>{d.submit_text || 'Submit Enquiry'}<Icon name="arrow-right" size={18} /></>}
              </button>
              <p className="form-card__note"><Icon name="lock" size={13} />{d.privacy_note}</p>
            </form>
          )}
        </div>
      </div>

      {s.map_enabled && mapQ && (
        <div className="container">
          <div className="map reveal reveal--zoom">
            <iframe
              title="Office location map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQ)}&z=15&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a className="map__btn btn btn--white" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`} target="_blank" rel="noreferrer">
              <Icon name="map-pin" size={16} />{d.map_button || 'Open in Google Maps'}
            </a>
          </div>
        </div>
      )}
    </section>
  )
}
