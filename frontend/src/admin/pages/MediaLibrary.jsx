import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AdminAPI } from '../../api/endpoints'
import { errorMessage } from '../../api/axiosInstance'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import { PageHeader, PageLoading, ErrorState, EmptyState, Spinner, Notice } from '../components/ui'
import Modal from '../components/Modal'
import Icon from '../../components/common/Icon'
import { formatBytes, formatDate, mediaUrl } from '../../utils/helpers'
import { MEDIA_FOLDER_LABELS } from '../../utils/constants'
import { usageLabel } from '../config/content'

function MediaDetails({ item, folders, onClose, onUpdated, onDeleted }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [full, setFull] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!item) return
    setFull(null)
    setForm({ original_name: item.original_name, alt_text: item.alt_text, folder: item.folder })
    AdminAPI.media.get(item.id).then((r) => setFull(r.data)).catch(() => setFull({ ...item, usage: [] }))
  }, [item])

  if (!item) return null
  const url = mediaUrl(item.path)
  const dirty = form.original_name !== item.original_name || form.alt_text !== item.alt_text || form.folder !== item.folder

  const save = async () => {
    setSaving(true)
    try {
      const res = await AdminAPI.media.update(item.id, form)
      onUpdated(res.data)
      toast.success('Image details saved.')
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success('Image link copied.') } catch { toast.error('Could not copy — select the link and copy it manually.') }
  }

  const remove = async () => {
    const usage = full?.usage || []
    const ok = await confirm({
      title: 'Delete this image?',
      danger: true,
      confirmText: usage.length ? 'Delete anyway' : 'Delete image',
      message: usage.length ? (
        <>
          <p>This image is <b>currently used</b> on the website in:</p>
          <ul className="adm-usage-list">{usage.map((u, i) => <li key={i}>{usageLabel(u).label}</li>)}</ul>
          <p>Those places will show <b>no image</b> until you choose a new one. This cannot be undone.</p>
        </>
      ) : 'The file will be permanently removed. This cannot be undone.',
    })
    if (!ok) return
    try {
      await AdminAPI.media.remove(item.id, usage.length > 0)
      toast.success('Image deleted.')
      onDeleted(item.id)
    } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <Modal open={!!item} onClose={onClose} variant="drawer" size="lg" title="Image details" subtitle={item.original_name}
      footer={(
        <>
          <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={remove}><Icon name="trash" size={16} />Delete</button>
          <span className="adm-grow" />
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Close</button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={save} disabled={!dirty || saving}>
            {saving ? <><Spinner size={15} light />Saving…</> : <><Icon name="save" size={16} />Save details</>}
          </button>
        </>
      )}>
      <div className="adm-media-detail">
        <a className="adm-media-detail__preview" href={url} target="_blank" rel="noreferrer" title="Open full size">
          <img src={url} alt={item.alt_text} />
        </a>
        <dl className="adm-meta">
          <div><dt>Dimensions</dt><dd>{item.width && item.height ? `${item.width} × ${item.height}px` : '—'}</dd></div>
          <div><dt>File size</dt><dd>{formatBytes(item.size)}</dd></div>
          <div><dt>Type</dt><dd>{item.mime?.replace('image/', '').toUpperCase()}</dd></div>
          <div><dt>Uploaded</dt><dd>{formatDate(item.created_at, true)}</dd></div>
        </dl>
        <div className="adm-copy">
          <input className="adm-input" readOnly value={url} onFocus={(e) => e.target.select()} />
          <button type="button" className="adm-btn adm-btn--soft" onClick={copy}><Icon name="copy" size={15} />Copy link</button>
        </div>

        <div className="adm-form-grid">
          <label className="adm-field">
            <span className="adm-field__label">Name</span>
            <input className="adm-input" value={form.original_name || ''} onChange={(e) => setForm({ ...form, original_name: e.target.value })} />
          </label>
          <label className="adm-field is-half">
            <span className="adm-field__label">Folder</span>
            <select className="adm-input" value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })}>
              {folders.map((f) => <option key={f} value={f}>{MEDIA_FOLDER_LABELS[f] || f}</option>)}
            </select>
          </label>
          <label className="adm-field">
            <span className="adm-field__label">Alt text (description)</span>
            <textarea className="adm-input" rows={2} value={form.alt_text || ''} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} />
            <p className="adm-field__help">Describe the photo in a few words. Helps Google and visitors using screen readers.</p>
          </label>
        </div>

        <div className="adm-usage">
          <h4><Icon name="link" size={15} />Where this image is used</h4>
          {!full ? <Spinner /> : full.usage.length === 0 ? <p className="adm-muted">Not used on the website yet.</p> : (
            <ul>{full.usage.map((u, i) => { const l = usageLabel(u); return <li key={i}><Link to={l.to} onClick={onClose}>{l.label}<Icon name="arrow-right" size={13} /></Link></li> })}</ul>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default function MediaLibrary() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [params] = useSearchParams()
  const [folder, setFolder] = useState('all')
  const [missingOnly, setMissingOnly] = useState(params.get('missing_alt') === '1')
  const [q, setQ] = useState('')
  const [view, setView] = useState('grid')
  const [uploading, setUploading] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [active, setActive] = useState(null)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await AdminAPI.media.list()
      setData(res.data)
      setError(null)
    } catch (e) { setError(errorMessage(e)) }
  }, [])
  useEffect(() => { load() }, [load])

  const items = useMemo(() => {
    if (!data) return []
    const t = q.trim().toLowerCase()
    return data.items.filter((m) => (folder === 'all' || m.folder === folder) && (!missingOnly || !m.alt_text?.trim()) && (!t || `${m.original_name} ${m.alt_text}`.toLowerCase().includes(t)))
  }, [data, folder, q, missingOnly])

  const upload = async (files) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/'))
    if (!list.length) return toast.error('Please choose JPG, PNG, WEBP or GIF images.')
    const tooBig = list.filter((f) => data && f.size > data.max_upload)
    if (tooBig.length) toast.error(`${tooBig.map((f) => f.name).join(', ')} — larger than ${formatBytes(data.max_upload)} and skipped.`)
    const ok = list.filter((f) => !data || f.size <= data.max_upload)
    if (!ok.length) return
    setUploading({ count: ok.length, progress: 0 })
    try {
      const res = await AdminAPI.media.upload(ok, folder === 'all' ? 'general' : folder, (p) => setUploading({ count: ok.length, progress: p }))
      toast.success(res.message)
      res.data.failed?.forEach((f) => toast.error(`${f.name}: ${f.error}`))
      await load()
    } catch (e) {
      toast.error(errorMessage(e, 'Upload failed.'))
    } finally { setUploading(null) }
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!data) return <PageLoading />

  const folders = ['all', ...data.folders]

  return (
    <div
      className={`adm-page adm-medialib ${dragging ? 'is-dragging' : ''}`}
      onDragOver={(e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); setDragging(true) } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false) }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files) }}
    >
      <PageHeader icon="image" title="Media Library" description="Every image on the website lives here. Upload once — then pick it from any section.">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => fileRef.current?.click()} disabled={!!uploading}>
          <Icon name="upload" size={16} />Upload images
        </button>
      </PageHeader>

      {uploading && (
        <div className="adm-upload-progress">
          <Spinner size={16} />
          <span>Uploading {uploading.count} image{uploading.count > 1 ? 's' : ''}… {uploading.progress}%</span>
          <div className="adm-progress"><i style={{ width: `${uploading.progress}%` }} /></div>
        </div>
      )}

      <button type="button" className="adm-dropzone" onClick={() => fileRef.current?.click()}>
        <Icon name="upload" size={22} />
        <span><b>Drag & drop images here</b> or click to browse</span>
        <small>JPG, PNG, WEBP or GIF · up to {formatBytes(data.max_upload)} each · uploads go to “{MEDIA_FOLDER_LABELS[folder === 'all' ? 'general' : folder]}”</small>
      </button>

      <div className="adm-media-toolbar">
        <div className="adm-chips">
          {folders.map((f) => (
            <button key={f} type="button" className={`adm-chip ${folder === f ? 'is-active' : ''}`} onClick={() => setFolder(f)}>
              {MEDIA_FOLDER_LABELS[f] || f}<span>{data.counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="adm-media-toolbar__right">
          <div className="adm-search">
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" />
          </div>
          <div className="adm-segment">
            <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} title="Grid view"><Icon name="grid" size={16} /></button>
            <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} title="List view"><Icon name="list" size={16} /></button>
          </div>
        </div>
      </div>

      <div className="adm-media-summary">
        <span className="adm-muted">{data.counts.all} images · {formatBytes(data.total_size)} used</span>
        <button type="button" className={`adm-chip ${missingOnly ? 'is-active' : ''}`} onClick={() => setMissingOnly((v) => !v)}>
          <Icon name="eye" size={14} />Missing alt text<span>{data.items.filter((m) => !m.alt_text?.trim()).length}</span>
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="image" title={q ? 'No matching images' : 'This folder is empty'} text={q ? `Nothing matches “${q}”.` : 'Upload images to start using them on the website.'} />
      ) : view === 'grid' ? (
        <div className="adm-media-grid">
          {items.map((m) => (
            <button type="button" key={m.id} className="adm-media-tile" onClick={() => setActive(m)} title={m.original_name}>
              <span className="adm-media-tile__img"><img src={mediaUrl(m.path)} alt={m.alt_text} loading="lazy" /></span>
              <span className="adm-media-tile__name">{m.original_name}</span>
              <span className="adm-media-tile__meta">{MEDIA_FOLDER_LABELS[m.folder] || m.folder} · {formatBytes(m.size)}</span>
              {!m.alt_text?.trim() && <span className="adm-media-tile__noalt">No alt text</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Image</th><th>Name</th><th>Folder</th><th>Size</th><th>Uploaded</th></tr></thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} onClick={() => setActive(m)} className="is-clickable">
                  <td><img className="adm-table__thumb" src={mediaUrl(m.path)} alt="" loading="lazy" /></td>
                  <td><b>{m.original_name}</b><br /><small className="adm-muted">{m.width}×{m.height}</small></td>
                  <td>{MEDIA_FOLDER_LABELS[m.folder] || m.folder}</td>
                  <td>{formatBytes(m.size)}</td>
                  <td>{formatDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Notice icon="info">Tip: replacing a photo on the website? Upload the new one here, then choose it in that section with <b>Change image</b>.</Notice>

      <div className="adm-medialib__drop"><Icon name="upload" size={40} /><b>Drop to upload</b></div>

      <MediaDetails
        item={active}
        folders={data.folders}
        onClose={() => setActive(null)}
        onUpdated={(m) => { setActive(m); setData((d) => ({ ...d, items: d.items.map((x) => (x.id === m.id ? m : x)) })); load() }}
        onDeleted={() => { setActive(null); load() }}
      />
    </div>
  )
}
