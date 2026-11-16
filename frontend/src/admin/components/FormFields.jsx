import { useEffect, useRef, useState } from 'react'
import Icon, { CONTENT_ICONS } from '../../components/common/Icon'
import ImageUpload from './ImageUpload'
import { Switch } from './ui'

let uid = 0
const nextId = () => `f${++uid}`

/* ---------------- Icon picker ---------------- */
export function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="adm-iconpicker" ref={ref}>
      <button type="button" className="adm-input adm-iconpicker__btn" onClick={() => setOpen((o) => !o)}>
        <span className="adm-iconpicker__current"><Icon name={value || 'zap'} size={18} /></span>
        <span>{value ? value.replace(/-/g, ' ') : 'Choose icon'}</span>
        <Icon name="chevron-down" size={16} className="adm-iconpicker__caret" />
      </button>
      {open && (
        <div className="adm-iconpicker__pop">
          {CONTENT_ICONS.map((n) => (
            <button key={n} type="button" title={n.replace(/-/g, ' ')} className={value === n ? 'is-active' : ''}
              onClick={() => { onChange(n); setOpen(false) }}>
              <Icon name={n} size={20} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- List of short texts ---------------- */
export function ListField({ value, onChange, addLabel = 'Add item', max, placeholder }) {
  const items = Array.isArray(value) ? value : []
  const set = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)))
  const move = (i, d) => {
    const next = [...items]
    const [it] = next.splice(i, 1)
    next.splice(i + d, 0, it)
    onChange(next)
  }
  return (
    <div className="adm-list">
      {items.map((it, i) => (
        <div className="adm-list__row" key={i}>
          <span className="adm-list__num">{i + 1}</span>
          <input className="adm-input" value={it} placeholder={placeholder} onChange={(e) => set(i, e.target.value)} />
          <div className="adm-list__tools">
            <button type="button" className="adm-icon-btn adm-icon-btn--sm" disabled={i === 0} onClick={() => move(i, -1)} title="Move up"><Icon name="chevron-up" size={15} /></button>
            <button type="button" className="adm-icon-btn adm-icon-btn--sm" disabled={i === items.length - 1} onClick={() => move(i, 1)} title="Move down"><Icon name="chevron-down" size={15} /></button>
            <button type="button" className="adm-icon-btn adm-icon-btn--sm is-danger" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove"><Icon name="trash" size={15} /></button>
          </div>
        </div>
      ))}
      {(!max || items.length < max) && (
        <button type="button" className="adm-add-row" onClick={() => onChange([...items, ''])}><Icon name="plus" size={16} />{addLabel}</button>
      )}
    </div>
  )
}

/* ---------------- Repeater (list of small objects) ---------------- */
export function RepeaterField({ value, onChange, fields, addLabel = 'Add item', itemLabel = 'Item', max }) {
  const items = Array.isArray(value) ? value : []
  const set = (i, name, v) => onChange(items.map((x, j) => (j === i ? { ...x, [name]: v } : x)))
  const move = (i, d) => {
    const next = [...items]
    const [it] = next.splice(i, 1)
    next.splice(i + d, 0, it)
    onChange(next)
  }
  return (
    <div className="adm-repeater">
      {items.map((it, i) => (
        <div className="adm-repeater__item" key={i}>
          <div className="adm-repeater__head">
            <b>{itemLabel} {i + 1}</b>
            <div className="adm-list__tools">
              <button type="button" className="adm-icon-btn adm-icon-btn--sm" disabled={i === 0} onClick={() => move(i, -1)} title="Move up"><Icon name="chevron-up" size={15} /></button>
              <button type="button" className="adm-icon-btn adm-icon-btn--sm" disabled={i === items.length - 1} onClick={() => move(i, 1)} title="Move down"><Icon name="chevron-down" size={15} /></button>
              <button type="button" className="adm-icon-btn adm-icon-btn--sm is-danger" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove"><Icon name="trash" size={15} /></button>
            </div>
          </div>
          <div className="adm-form-grid">
            {fields.map((f) => (
              <FieldRenderer key={f.name} field={f} value={it?.[f.name]} onChange={(v) => set(i, f.name, v)} />
            ))}
          </div>
        </div>
      ))}
      {(!max || items.length < max) && (
        <button type="button" className="adm-add-row" onClick={() => onChange([...items, {}])}><Icon name="plus" size={16} />{addLabel}</button>
      )}
    </div>
  )
}

/* ---------------- Star rating ---------------- */
function Rating({ value, onChange }) {
  const v = Number(value) || 0
  return (
    <div className="adm-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className={n <= v ? 'is-on' : ''} aria-label={`${n} star`}>
          <Icon name="star" size={22} fill={n <= v ? 'currentColor' : 'none'} />
        </button>
      ))}
      <span>{v ? `${v} / 5` : 'No rating'}</span>
    </div>
  )
}

/* ---------------- Single field ---------------- */
export function FieldRenderer({ field, value, onChange, error, suggestions }) {
  const [id] = useState(nextId)
  const f = field
  const type = f.type || 'text'
  const full = !f.half

  let input
  switch (type) {
    case 'textarea':
      input = <textarea id={id} className="adm-input" rows={f.rows || 3} value={value ?? ''} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      break
    case 'image':
      input = <ImageUpload value={value || ''} onChange={onChange} folder={f.folder} />
      break
    case 'icon':
      input = <IconPicker value={value} onChange={onChange} />
      break
    case 'list':
      input = <ListField value={value} onChange={onChange} addLabel={f.addLabel} max={f.max} placeholder={f.placeholder} />
      break
    case 'repeater':
      input = <RepeaterField value={value} onChange={onChange} fields={f.fields} addLabel={f.addLabel} itemLabel={f.itemLabel} max={f.max} />
      break
    case 'toggle':
      return (
        <div className={`adm-field adm-field--toggle ${f.half ? 'is-half' : ''}`}>
          <Switch id={id} checked={!!value} onChange={onChange} label={f.label} />
          {f.help && <p className="adm-field__help">{f.help}</p>}
        </div>
      )
    case 'rating':
      input = <Rating value={value} onChange={onChange} />
      break
    case 'select':
      input = (
        <select id={id} className="adm-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {f.options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      )
      break
    default: {
      const inputType = type === 'email' ? 'email' : type === 'phone' ? 'tel' : type === 'password' ? 'password' : 'text'
      input = (
        <div className={`adm-input-wrap ${type === 'link' ? 'has-icon' : ''}`}>
          {type === 'link' && <Icon name="link" size={15} className="adm-input-wrap__icon" />}
          <input
            id={id} type={inputType} className="adm-input" value={value ?? ''} placeholder={f.placeholder || (type === 'link' ? '#contact or https://…' : '')}
            onChange={(e) => onChange(e.target.value)} list={suggestions?.length ? `${id}-list` : undefined} autoComplete={f.autoComplete || 'off'}
          />
          {suggestions?.length > 0 && <datalist id={`${id}-list`}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
        </div>
      )
    }
  }

  return (
    <div className={`adm-field ${full ? '' : 'is-half'} ${error ? 'has-error' : ''}`}>
      <label htmlFor={id} className="adm-field__label">
        {f.label}{f.required && <span className="adm-req">*</span>}
        {f.max && (type === 'list' || type === 'repeater') && <small> (max {f.max})</small>}
      </label>
      {input}
      {error ? <p className="adm-field__error"><Icon name="alert" size={13} />{error}</p> : f.help && <p className="adm-field__help">{f.help}</p>}
    </div>
  )
}

/* ---------------- A grid of fields ---------------- */
export function SchemaForm({ fields, values, onChange, errors = {}, suggestions = {} }) {
  return (
    <div className="adm-form-grid">
      {fields.map((f) => (
        <FieldRenderer
          key={f.name}
          field={f}
          value={values?.[f.name]}
          error={errors[f.name]}
          suggestions={suggestions[f.name]}
          onChange={(v) => onChange({ ...values, [f.name]: v }, f.name)}
        />
      ))}
    </div>
  )
}
