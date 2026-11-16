import Icon from './Icon'
import { telHref, whatsappHref } from '../../utils/helpers'

/** Floating Call + WhatsApp buttons (numbers & ready-made message come from Admin → Site Settings). */
export default function WhatsAppButton({ settings: s }) {
  const showCall = s.show_call_button !== false && s.phone
  const showWa = s.show_whatsapp_button !== false && s.whatsapp
  if (!showCall && !showWa) return null

  return (
    <div className="float-actions">
      {showWa && (
        <a className="float-btn float-btn--wa" href={whatsappHref(s.whatsapp, s.whatsapp_message)} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M16.04 3C9.4 3 4 8.36 4 14.97c0 2.11.56 4.17 1.62 5.99L4 29l8.27-2.16a12.1 12.1 0 0 0 3.77.6h.01c6.63 0 12.03-5.36 12.03-11.97C28.08 8.36 22.68 3 16.04 3zm0 21.9h-.01a10 10 0 0 1-5.08-1.39l-.36-.22-4.91 1.28 1.31-4.77-.24-.38a9.85 9.85 0 0 1-1.53-5.27c0-5.5 4.5-9.97 10.04-9.97 2.68 0 5.2 1.04 7.1 2.92a9.88 9.88 0 0 1 2.94 7.06c0 5.5-4.5 9.98-10.03 9.98zm5.5-7.47c-.3-.15-1.78-.87-2.06-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.46-2.42-1.48a9.04 9.04 0 0 1-1.67-2.07c-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.23-.25-.58-.5-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.27.49 1.7.63.72.22 1.37.19 1.88.12.58-.09 1.78-.72 2.03-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35z" /></svg>
          <span className="float-btn__label">{s.whatsapp_label || 'WhatsApp us'}</span>
        </a>
      )}
      {showCall && (
        <a className="float-btn float-btn--call" href={telHref(s.phone)} aria-label={`Call ${s.phone}`}>
          <Icon name="phone" size={24} />
          <span className="float-btn__label">{s.call_label || 'Call us'}: {s.phone}</span>
        </a>
      )}
    </div>
  )
}
