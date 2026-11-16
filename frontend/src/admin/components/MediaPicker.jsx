import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Modal from './Modal'
import Icon from '../../components/common/Icon'
import { Spinner, EmptyState } from './ui'
import { AdminAPI } from '../../api/endpoints'
import { errorMessage } from '../../api/axiosInstance'
import { formatBytes, mediaUrl } from '../../utils/helpers'
import { MEDIA_FOLDER_LABELS } from '../../utils/constants'
import { useToast } from './Toast'

/**
 * Choose an image from the media library — or upload a new one (it is saved to the library first).
 * onSelect(mediaItem)
 */
export default function MediaPicker({ open, onClose, onSelect, folder = 'general', currentPath }) {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState(folder)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(0)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await AdminAPI.media.list()
      setData(res.data)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }, [toast])

  useEffect(() => {
    if (open) {
      setSelected(null)
      setQ('')
      load()
    }
  }, [open, load])

  // open on the field's own folder when it has images, otherwise show everything
  useEffect(() => {
    if (open && data) setFilter((data.counts?.[folder] ?? 0) > 0 ? folder : 'all')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, !!data])

  const items = useMemo(() => {
    if (!data) return []
    const term = q.trim().toLowerCase()
    return data.items.filter((m) =>
      (filter === 'all' || m.folder === filter) &&
      (!term || `${m.original_name} ${m.alt_text}`.toLowerCase().includes(term)))
  }, [data, filter, q])

  const upload = async (files) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/'))
    if (!list.length) return toast.error('Please choose JPG, PNG, WEBP or GIF images.')
    setUploading(1)
    try {
      const target = filter === 'all' ? folder : filter
      const res = await AdminAPI.media.upload(list, target, (p) => setUploading(Math.max(1, p)))
      toast.success(res.message)
      res.data.failed?.forEach((f) => toast.error(`${f.name}: ${f.error}`))
      await load()
      setFilter(target)
      if (res.data.items?.[0]) setSelected(res.data.items[0])
    } catch (e) {
      toast.error(errorMessage(e, 'Upload failed.'))
    } finally {
      setUploading(0)
    }
  }

  const choose = (item = selected) => {
    if (!item) return
    onSelect(item)
    onClose()
  }

  const folders = ['all', ...(data?.folders || [])]

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Media Library"
      subtitle="Pick an image, or upload a new one — it is saved to the library so you can reuse it anywhere."
      bodyClass="adm-picker__body"
      footer={(
        <>
          <span className="adm-picker__hint">
            {selected ? <><b>{selected.original_name}</b> · {selected.width}×{selected.height}</> : 'Tip: double-click an image to use it instantly.'}
          </span>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="adm-btn adm-btn--primary" disabled={!selected} onClick={() => choose()}>
            <Icon name="check" size={16} />Use this image
          </button>
        </>
      )}
    >
      <div
        className={`adm-picker ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false) }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files) }}
      >
        <div className="adm-picker__toolbar">
          <div className="adm-search">
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search images…" />
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
          <button type="button" className="adm-btn adm-btn--yellow" onClick={() => fileRef.current?.click()} disabled={!!uploading}>
            {uploading ? <><Spinner size={14} />Uploading {uploading}%</> : <><Icon name="upload" size={16} />Upload new</>}
          </button>
        </div>

        <div className="adm-chips">
          {folders.map((f) => (
            <button key={f} type="button" className={`adm-chip ${filter === f ? 'is-active' : ''}`} onClick={() => setFilter(f)}>
              {MEDIA_FOLDER_LABELS[f] || f}<span>{data?.counts?.[f] ?? 0}</span>
            </button>
          ))}
        </div>

        {!data ? (
          <div className="adm-center-pad"><Spinner size={28} /></div>
        ) : items.length === 0 ? (
          <EmptyState icon="image" title="No images here yet" text="Drag & drop images here, or click “Upload new”."
            action={<button type="button" className="adm-btn adm-btn--primary" onClick={() => fileRef.current?.click()}><Icon name="upload" size={16} />Upload images</button>} />
        ) : (
          <div className="adm-media-grid adm-media-grid--picker">
            {items.map((m) => (
              <button
                type="button"
                key={m.id}
                className={`adm-media-tile ${selected?.id === m.id ? 'is-selected' : ''} ${currentPath === m.path ? 'is-current' : ''}`}
                onClick={() => setSelected(m)}
                onDoubleClick={() => choose(m)}
                title={m.original_name}
              >
                <span className="adm-media-tile__img"><img src={mediaUrl(m.path)} alt={m.alt_text} loading="lazy" /></span>
                <span className="adm-media-tile__name">{m.original_name}</span>
                <span className="adm-media-tile__meta">{m.width}×{m.height} · {formatBytes(m.size)}</span>
                {selected?.id === m.id && <span className="adm-media-tile__check"><Icon name="check" size={14} strokeWidth={3} /></span>}
                {currentPath === m.path && <span className="adm-media-tile__current">In use here</span>}
              </button>
            ))}
          </div>
        )}
        <div className="adm-picker__drop"><Icon name="upload" size={34} /><b>Drop images to upload</b></div>
      </div>
    </Modal>
  )
}
