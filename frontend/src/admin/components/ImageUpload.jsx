import { useEffect, useRef, useState } from 'react'
import MediaPicker from './MediaPicker'
import Icon from '../../components/common/Icon'
import { mediaUrl } from '../../utils/helpers'
import { AdminAPI } from '../../api/endpoints'

/**
 * Image field: preview of the chosen media-library image with Change / Remove,
 * plus an alt-text box that is saved straight to the media library (used on the website for SEO & accessibility).
 * value = stored media path (uploads/media/...)
 */
export default function ImageUpload({ value, onChange, folder = 'general', compact = false }) {
  const [open, setOpen] = useState(false)
  const [broken, setBroken] = useState(false)
  const [media, setMedia] = useState(null)
  const [alt, setAlt] = useState('')
  const [altState, setAltState] = useState('idle') // idle | saving | saved | error
  const timer = useRef(null)

  // load the media record (for alt text) whenever the image changes
  useEffect(() => {
    setMedia(null)
    setAlt('')
    setAltState('idle')
    if (!value) return
    let alive = true
    AdminAPI.media.list({ path: value }).then((r) => {
      if (!alive) return
      const m = r.data.items[0] || null
      setMedia(m)
      setAlt(m?.alt_text || '')
    }).catch(() => {})
    return () => { alive = false }
  }, [value])

  const saveAlt = (text) => {
    if (!media) return
    clearTimeout(timer.current)
    setAltState('saving')
    timer.current = setTimeout(async () => {
      try {
        await AdminAPI.media.update(media.id, { alt_text: text })
        setAltState('saved')
      } catch {
        setAltState('error')
      }
    }, 700)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className={`adm-imagefield ${compact ? 'is-compact' : ''} ${value ? 'has-image' : ''}`}>
      {value ? (
        <>
          <button type="button" className="adm-imagefield__preview" onClick={() => setOpen(true)} title="Change image">
            {broken
              ? <span className="adm-imagefield__broken"><Icon name="alert" />Image file missing</span>
              : <img src={mediaUrl(value)} alt={alt} onError={() => setBroken(true)} onLoad={() => setBroken(false)} />}
            <span className="adm-imagefield__hover"><Icon name="image" size={18} />Change image</span>
          </button>
          <div className="adm-imagefield__actions">
            <span className="adm-imagefield__path" title={value}>{value.split('/').pop()}</span>
            <button type="button" className="adm-btn adm-btn--soft adm-btn--sm" onClick={() => setOpen(true)}><Icon name="image" size={14} />Change</button>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => onChange('')}><Icon name="x" size={14} />Remove</button>
          </div>
          {media && (
            <div className={`adm-alt ${!alt.trim() ? 'is-missing' : ''}`}>
              <label>
                <span className="adm-alt__label">
                  <Icon name="eye" size={13} />Alt text <small>(describes the image for Google & screen readers)</small>
                  <em className={`adm-alt__state is-${altState}`}>
                    {altState === 'saving' ? 'Saving…' : altState === 'saved' ? '✓ Saved' : altState === 'error' ? 'Not saved' : !alt.trim() ? 'Missing' : ''}
                  </em>
                </span>
                <input className="adm-input" value={alt} maxLength={255} placeholder="e.g. Engineers installing a 2500 kVA transformer"
                  onChange={(e) => { setAlt(e.target.value); saveAlt(e.target.value) }} />
              </label>
            </div>
          )}
        </>
      ) : (
        <button type="button" className="adm-imagefield__empty" onClick={() => setOpen(true)}>
          <span className="adm-imagefield__empty-icon"><Icon name="image" size={22} /></span>
          <b>Choose from Media Library</b>
          <small>or upload a new image</small>
        </button>
      )}

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        folder={folder}
        currentPath={value}
        onSelect={(m) => { setBroken(false); onChange(m.path) }}
      />
    </div>
  )
}
