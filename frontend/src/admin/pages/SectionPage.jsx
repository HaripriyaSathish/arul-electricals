import { useCallback, useEffect, useMemo, useState } from 'react'
import { PAGES, COLLECTIONS } from '../config/content'
import { AdminAPI } from '../../api/endpoints'
import { errorMessage, fieldErrors } from '../../api/axiosInstance'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import { useUnsavedGuard } from '../../hooks/useFetch'
import { PageHeader, Switch, Notice, Card, PageLoading, ErrorState, EmptyState, Badge, Spinner } from '../components/ui'
import { SchemaForm } from '../components/FormFields'
import Modal from '../components/Modal'
import Icon from '../../components/common/Icon'
import { mediaUrl, timeAgo, pad2 } from '../../utils/helpers'

/* =========================================================
   Shared: load + save a single section record
   ========================================================= */
export function useSection(key) {
  const toast = useToast()
  const [state, setState] = useState({ loading: true, error: null })
  const [values, setValues] = useState({})
  const [saved, setSaved] = useState('{}')
  const [visible, setVisible] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const load = useCallback(async () => {
    setState({ loading: true, error: null })
    try {
      const res = await AdminAPI.sections.get(key)
      const data = Array.isArray(res.data.data) ? {} : res.data.data || {}
      setValues(data)
      setSaved(JSON.stringify(data))
      setVisible(res.data.is_visible)
      setUpdatedAt(res.data.updated_at)
      setState({ loading: false, error: null })
    } catch (e) {
      setState({ loading: false, error: errorMessage(e) })
    }
  }, [key])

  useEffect(() => { load() }, [load])

  const dirty = !state.loading && JSON.stringify(values) !== saved

  const save = async (requiredFields = []) => {
    const missing = {}
    requiredFields.forEach((f) => { if (!String(values[f.name] ?? '').trim()) missing[f.name] = `${f.label} is required.` })
    setErrors(missing)
    if (Object.keys(missing).length) return toast.error('Please fill in the required fields.')
    setSaving(true)
    try {
      const res = await AdminAPI.sections.save(key, { data: values })
      setSaved(JSON.stringify(res.data.data))
      setValues(res.data.data)
      setUpdatedAt(res.data.updated_at)
      toast.success(res.message)
      return true
    } catch (e) {
      setErrors(fieldErrors(e))
      toast.error(errorMessage(e))
      return false
    } finally {
      setSaving(false)
    }
  }

  const discard = () => { setValues(JSON.parse(saved)); setErrors({}) }

  const toggleVisible = async (v) => {
    setVisible(v)
    try {
      await AdminAPI.sections.save(key, { is_visible: v })
      toast.success(v ? 'Section is now visible on the website.' : 'Section hidden from the website.')
    } catch (e) {
      setVisible(!v)
      toast.error(errorMessage(e))
    }
  }

  return { ...state, values, setValues, dirty, save, discard, saving, errors, visible, toggleVisible, updatedAt, reload: load }
}

/* Sticky bar that appears when there are unsaved changes */
export function SaveBar({ dirty, saving, onSave, onDiscard, updatedAt }) {
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty && !saving) onSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, saving, onSave])

  return (
    <div className={`adm-savebar ${dirty ? 'is-dirty' : ''}`}>
      <div className="adm-savebar__status">
        {dirty
          ? <><span className="adm-dot adm-dot--yellow" />You have unsaved changes</>
          : <><Icon name="check-circle" size={16} />All changes saved{updatedAt && <small> · updated {timeAgo(updatedAt)}</small>}</>}
      </div>
      <div className="adm-savebar__actions">
        {dirty && <button type="button" className="adm-btn adm-btn--ghost" onClick={onDiscard} disabled={saving}>Discard</button>}
        <button type="button" className="adm-btn adm-btn--primary" onClick={onSave} disabled={!dirty || saving}>
          {saving ? <><Spinner size={15} light />Saving…</> : <><Icon name="save" size={16} />Save & publish</>}
        </button>
      </div>
    </div>
  )
}

function SectionHeader({ page, section, extra }) {
  return (
    <PageHeader icon={page.icon} eyebrow={page.key === 'legal' ? 'Settings' : 'Website content'} title={page.title} description={page.description}>
      {page.canHide !== false && (
        <div className={`adm-visibility ${section.visible ? 'is-on' : ''}`}>
          <Switch checked={section.visible} onChange={section.toggleVisible} label={section.visible ? 'Visible on website' : 'Hidden'} />
        </div>
      )}
      <a className="adm-btn adm-btn--soft" href={`/#${page.anchor}`} target="_blank" rel="noreferrer"><Icon name="eye" size={16} />Preview</a>
      {extra}
    </PageHeader>
  )
}

/* =========================================================
   Single-record section (hero, about, CTA, ...)
   ========================================================= */
function SingletonEditor({ page }) {
  const section = useSection(page.sectionKey)
  const confirm = useConfirm()
  useUnsavedGuard(section.dirty, confirm)
  const allFields = useMemo(() => page.groups.flatMap((g) => g.fields), [page])

  if (section.loading) return <PageLoading />
  if (section.error) return <ErrorState message={section.error} onRetry={section.reload} />

  return (
    <div className="adm-page">
      <SectionHeader page={page} section={section} />
      {!section.visible && page.canHide !== false && <Notice tone="warning" icon="eye-off">This section is currently <b>hidden</b> from the website. Turn on “Visible on website” to show it.</Notice>}
      {page.notice && <Notice>{page.notice}</Notice>}

      <div className="adm-stack">
        {page.groups.map((g) => (
          <Card key={g.title} title={g.title} icon={g.icon}>
            <SchemaForm fields={g.fields} values={section.values} errors={section.errors} onChange={section.setValues} />
          </Card>
        ))}
      </div>

      <SaveBar dirty={section.dirty} saving={section.saving} updatedAt={section.updatedAt}
        onSave={() => section.save(allFields.filter((f) => f.required))} onDiscard={section.discard} />
    </div>
  )
}

/* =========================================================
   Repeatable cards (services, projects, ...)
   ========================================================= */
function ItemForm({ open, onClose, cfg, item, resource, onSaved, categories }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [values, setValues] = useState({})
  const [initial, setInitial] = useState('{}')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const v = item ? { ...item } : { ...cfg.defaults }
    setValues(v)
    setInitial(JSON.stringify(v))
    setErrors({})
  }, [open, item, cfg])

  const dirty = JSON.stringify(values) !== initial

  const close = async () => {
    if (dirty && !(await confirm({ title: 'Discard changes?', message: 'Your changes to this item have not been saved.', confirmText: 'Discard', danger: true, icon: 'alert' }))) return
    onClose()
  }

  const submit = async (e) => {
    e?.preventDefault()
    const missing = {}
    cfg.fields.filter((f) => f.required).forEach((f) => { if (!String(values[f.name] ?? '').trim()) missing[f.name] = `${f.label} is required.` })
    setErrors(missing)
    if (Object.keys(missing).length) return
    setSaving(true)
    try {
      const body = Object.fromEntries(cfg.fields.map((f) => [f.name, values[f.name] ?? (f.type === 'toggle' ? false : '')]))
      const res = item ? await AdminAPI.collection.update(resource, item.id, body) : await AdminAPI.collection.create(resource, body)
      toast.success(res.message)
      onSaved(res.data, !item)
      onClose()
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      variant="drawer"
      size="lg"
      title={item ? `Edit ${cfg.singular.toLowerCase()}` : `Add ${cfg.singular.toLowerCase()}`}
      subtitle={item ? item[cfg.titleField] : 'New items appear on the website as soon as you save.'}
      footer={(
        <>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={close}>Cancel</button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={submit} disabled={saving}>
            {saving ? <><Spinner size={15} light />Saving…</> : <><Icon name="save" size={16} />{item ? 'Save changes' : `Add ${cfg.singular.toLowerCase()}`}</>}
          </button>
        </>
      )}
    >
      <form onSubmit={submit}>
        <SchemaForm fields={cfg.fields} values={values} errors={errors} onChange={setValues} suggestions={{ category: categories }} />
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

function CollectionEditor({ page }) {
  const cfg = COLLECTIONS[page.collection]
  const resource = page.collection
  const toast = useToast()
  const confirm = useConfirm()
  const section = useSection(page.sectionKey)
  const [tab, setTab] = useState('items')
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  useUnsavedGuard(section.dirty, confirm)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await AdminAPI.collection.list(resource)
      setItems(res.data)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [resource])
  useEffect(() => { load() }, [load])

  const categories = useMemo(() => [...new Set((items || []).map((i) => i.category).filter(Boolean))], [items])
  const term = q.trim().toLowerCase()
  const shown = (items || []).filter((i) => !term || JSON.stringify([i[cfg.titleField], i[cfg.subtitleField], i[cfg.badgeField]]).toLowerCase().includes(term))
  const canDrag = !term

  const saveOrder = async (next) => {
    const prev = items
    setItems(next)
    try {
      await AdminAPI.collection.reorder(resource, next.map((i) => i.id))
      toast.success('New order saved.')
    } catch (e) {
      setItems(prev)
      toast.error(errorMessage(e))
    }
  }
  const move = (index, delta) => {
    const next = [...items]
    const [it] = next.splice(index, 1)
    next.splice(index + delta, 0, it)
    saveOrder(next)
  }
  const onDrop = (targetId) => {
    if (!dragId || dragId === targetId) return
    const next = [...items]
    const from = next.findIndex((i) => i.id === dragId)
    const to = next.findIndex((i) => i.id === targetId)
    const [it] = next.splice(from, 1)
    next.splice(to, 0, it)
    setDragId(null)
    setOverId(null)
    saveOrder(next)
  }

  const toggle = async (item, v) => {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, is_active: v } : i)))
    try {
      await AdminAPI.collection.update(resource, item.id, { is_active: v })
      toast.success(v ? `“${item[cfg.titleField]}” is now visible.` : `“${item[cfg.titleField]}” hidden from the website.`)
    } catch (e) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, is_active: !v } : i)))
      toast.error(errorMessage(e))
    }
  }

  const duplicate = async (item) => {
    try {
      const res = await AdminAPI.collection.duplicate(resource, item.id)
      setItems((list) => [...list, res.data])
      toast.success(res.message)
    } catch (e) { toast.error(errorMessage(e)) }
  }

  const remove = async (item) => {
    const ok = await confirm({
      title: `Delete this ${cfg.singular.toLowerCase()}?`,
      message: <>“<b>{item[cfg.titleField]}</b>” will be removed from the website. {cfg.imageField && 'Its image stays in the Media Library.'} <br /><small>Tip: switch it off instead if you only want to hide it for now.</small></>,
      confirmText: 'Delete', danger: true,
    })
    if (!ok) return
    try {
      const res = await AdminAPI.collection.remove(resource, item.id)
      setItems((list) => list.filter((i) => i.id !== item.id))
      toast.success(res.message)
    } catch (e) { toast.error(errorMessage(e)) }
  }

  const onSaved = (saved, isNew) => setItems((list) => (isNew ? [...list, saved] : list.map((i) => (i.id === saved.id ? saved : i))))

  if (section.loading || (!items && !error)) return <PageLoading />
  if (error || section.error) return <ErrorState message={error || section.error} onRetry={() => { load(); section.reload() }} />

  const activeCount = items.filter((i) => i.is_active).length

  return (
    <div className="adm-page">
      <SectionHeader page={page} section={section} extra={(
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => { setTab('items'); setEditing('new') }}>
          <Icon name="plus" size={16} />Add {cfg.singular.toLowerCase()}
        </button>
      )} />

      {!section.visible && <Notice tone="warning" icon="eye-off">This whole section is <b>hidden</b> from the website. Turn on “Visible on website” to show it.</Notice>}
      {page.notice && <Notice>{page.notice}</Notice>}

      <div className="adm-tabs" role="tablist">
        <button type="button" role="tab" className={tab === 'items' ? 'is-active' : ''} onClick={() => setTab('items')}>
          <Icon name="list" size={16} />{cfg.plural}<span>{items.length}</span>
        </button>
        {page.headingFields && (
          <button type="button" role="tab" className={tab === 'heading' ? 'is-active' : ''} onClick={() => setTab('heading')}>
            <Icon name="edit" size={16} />Section heading & text{section.dirty && <i className="adm-dot adm-dot--yellow" />}
          </button>
        )}
      </div>

      {tab === 'items' ? (
        <Card className="adm-card--flush">
          <div className="adm-list-toolbar">
            <div className="adm-search">
              <Icon name="search" size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.plural.toLowerCase()}…`} />
            </div>
            <span className="adm-list-toolbar__meta">
              {activeCount} of {items.length} visible{canDrag && items.length > 1 && <> · <Icon name="grip" size={13} /> drag to reorder</>}
            </span>
          </div>

          {items.length === 0 ? (
            <EmptyState icon={page.icon} title={`No ${cfg.plural.toLowerCase()} yet`} text={page.key === 'testimonials' ? 'Add genuine client testimonials when you have them.' : `Add your first ${cfg.singular.toLowerCase()} to show it on the website.`}
              action={<button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}><Icon name="plus" size={16} />Add {cfg.singular.toLowerCase()}</button>} />
          ) : shown.length === 0 ? (
            <EmptyState icon="search" title="No matches" text={`Nothing matches “${q}”.`} />
          ) : (
            <ul className="adm-items">
              {shown.map((item) => {
                const index = items.indexOf(item)
                return (
                  <li
                    key={item.id}
                    className={`adm-item ${!item.is_active ? 'is-off' : ''} ${dragId === item.id ? 'is-dragging' : ''} ${overId === item.id ? 'is-over' : ''}`}
                    draggable={canDrag}
                    onDragStart={(e) => { setDragId(item.id); e.dataTransfer.effectAllowed = 'move' }}
                    onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverId(item.id) } }}
                    onDragLeave={() => setOverId((o) => (o === item.id ? null : o))}
                    onDrop={(e) => { e.preventDefault(); onDrop(item.id) }}
                    onDragEnd={() => { setDragId(null); setOverId(null) }}
                  >
                    {canDrag && <span className="adm-item__grip" title="Drag to reorder"><Icon name="grip" size={18} /></span>}
                    <span className="adm-item__num">{pad2(index + 1)}</span>
                    <button type="button" className="adm-item__thumb" onClick={() => setEditing(item)}>
                      {cfg.imageField && item[cfg.imageField]
                        ? <img src={mediaUrl(item[cfg.imageField])} alt="" loading="lazy" />
                        : <Icon name={(cfg.iconField && item[cfg.iconField]) || page.icon} size={22} />}
                    </button>
                    <button type="button" className="adm-item__main" onClick={() => setEditing(item)}>
                      <span className="adm-item__title">
                        {item[cfg.titleField]}
                        {cfg.badgeField && item[cfg.badgeField] && <Badge tone="violet">{item[cfg.badgeField]}</Badge>}
                        {item.is_featured && <Badge tone="yellow">Featured</Badge>}
                        {item.is_illustrative && <Badge tone="gray">Illustrative</Badge>}
                        {resource === 'testimonials' && item.rating && <Badge tone="yellow">★ {item.rating}</Badge>}
                      </span>
                      <span className="adm-item__sub">{item[cfg.subtitleField] || <i>No description</i>}</span>
                    </button>
                    <div className="adm-item__status">
                      <Switch size="sm" checked={item.is_active} onChange={(v) => toggle(item, v)} label={item.is_active ? 'Visible' : 'Hidden'} />
                    </div>
                    <div className="adm-item__actions">
                      {canDrag && (
                        <span className="adm-item__arrows">
                          <button type="button" className="adm-icon-btn adm-icon-btn--sm" disabled={index === 0} onClick={() => move(index, -1)} title="Move up"><Icon name="chevron-up" size={16} /></button>
                          <button type="button" className="adm-icon-btn adm-icon-btn--sm" disabled={index === items.length - 1} onClick={() => move(index, 1)} title="Move down"><Icon name="chevron-down" size={16} /></button>
                        </span>
                      )}
                      <button type="button" className="adm-icon-btn" onClick={() => setEditing(item)} title="Edit"><Icon name="edit" size={17} /></button>
                      <button type="button" className="adm-icon-btn" onClick={() => duplicate(item)} title="Duplicate"><Icon name="copy" size={17} /></button>
                      <button type="button" className="adm-icon-btn is-danger" onClick={() => remove(item)} title="Delete"><Icon name="trash" size={17} /></button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      ) : (
        <>
          <Card title="Section heading & text" icon="edit" description="The text shown above the cards on the website.">
            <SchemaForm fields={page.headingFields} values={section.values} errors={section.errors} onChange={section.setValues} />
          </Card>
          <SaveBar dirty={section.dirty} saving={section.saving} updatedAt={section.updatedAt}
            onSave={() => section.save(page.headingFields.filter((f) => f.required))} onDiscard={section.discard} />
        </>
      )}

      <ItemForm
        open={!!editing}
        onClose={() => setEditing(null)}
        cfg={cfg}
        resource={resource}
        item={editing === 'new' ? null : editing}
        onSaved={onSaved}
        categories={categories}
      />
    </div>
  )
}

export default function SectionPage({ pageKey }) {
  const page = { ...PAGES[pageKey], key: pageKey }
  return page.collection ? <CollectionEditor page={page} /> : <SingletonEditor page={page} />
}
