import Icon from '../../components/common/Icon'

export function Switch({ checked, onChange, label, disabled, size = 'md', id }) {
  return (
    <label className={`adm-switch adm-switch--${size} ${disabled ? 'is-disabled' : ''}`} htmlFor={id}>
      <input id={id} type="checkbox" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
      {label && <span className="adm-switch__label">{label}</span>}
    </label>
  )
}

export function Spinner({ size = 18, light = false }) {
  return <span className={`adm-spinner ${light ? 'is-light' : ''}`} style={{ width: size, height: size }} aria-label="Loading" />
}

export function PageHeader({ icon, title, description, children, eyebrow }) {
  return (
    <div className="adm-page-head">
      <div className="adm-page-head__main">
        {icon && <div className="adm-page-head__icon"><Icon name={icon} size={22} /></div>}
        <div>
          {eyebrow && <div className="adm-page-head__eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children && <div className="adm-page-head__actions">{children}</div>}
    </div>
  )
}

export function Notice({ tone = 'info', icon, children, action }) {
  return (
    <div className={`adm-notice adm-notice--${tone}`}>
      <Icon name={icon || (tone === 'warning' ? 'alert' : 'info')} size={18} />
      <div className="adm-notice__text">{children}</div>
      {action}
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, text, action }) {
  return (
    <div className="adm-empty">
      <div className="adm-empty__icon"><Icon name={icon} size={28} /></div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Badge({ tone = 'violet', children, dot }) {
  return <span className={`adm-badge adm-badge--${tone}`}>{dot && <i />}{children}</span>
}

export function Card({ title, icon, description, children, actions, className = '' }) {
  return (
    <section className={`adm-card ${className}`}>
      {(title || actions) && (
        <header className="adm-card__head">
          <div className="adm-card__title">
            {icon && <span className="adm-card__icon"><Icon name={icon} size={16} /></span>}
            <div>
              <h2>{title}</h2>
              {description && <p>{description}</p>}
            </div>
          </div>
          {actions}
        </header>
      )}
      <div className="adm-card__body">{children}</div>
    </section>
  )
}

export function Skeleton({ h = 16, w = '100%', r = 8, style }) {
  return <span className="adm-skeleton" style={{ height: h, width: w, borderRadius: r, ...style }} />
}

export function PageLoading({ rows = 4 }) {
  return (
    <div className="adm-page-loading">
      <Skeleton h={34} w="40%" />
      <Skeleton h={16} w="60%" />
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} h={72} r={14} />)}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon="alert"
      title="Couldn’t load this page"
      text={message}
      action={onRetry && <button type="button" className="adm-btn adm-btn--primary" onClick={onRetry}><Icon name="refresh" size={16} />Try again</button>}
    />
  )
}
