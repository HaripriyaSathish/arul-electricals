import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../components/common/Icon'

/**
 * Centered dialog (variant="modal") or right-side panel (variant="drawer").
 */
export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', variant = 'modal', bodyClass = '' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={`adm-overlay adm-overlay--${variant}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className={`adm-${variant} adm-${variant}--${size}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        {title && (
          <header className="adm-dialog__head">
            <div>
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
          </header>
        )}
        <div className={`adm-dialog__body ${bodyClass}`}>{children}</div>
        {footer && <footer className="adm-dialog__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
