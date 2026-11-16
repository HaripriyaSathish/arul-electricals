import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminAPI } from '../../api/endpoints'
import { errorMessage } from '../../api/axiosInstance'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import { useAdminShell } from '../AdminLayout'
import { PageHeader, PageLoading, ErrorState, EmptyState, Badge, Spinner } from '../components/ui'
import Modal from '../components/Modal'
import Icon from '../../components/common/Icon'
import { ENQUIRY_STATUS } from '../../utils/constants'
import { formatDate, telHref, timeAgo, whatsappHref } from '../../utils/helpers'

function EnquiryDrawer({ enquiry, onClose, onChange, onDelete }) {
  const toast = useToast()
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => { setNotes(enquiry?.notes || '') }, [enquiry])
  if (!enquiry) return null
  const e = enquiry

  const setStatus = async (status) => {
    try {
      const res = await AdminAPI.enquiries.update(e.id, { status })
      onChange(res.data)
      toast.success(`Marked as ${ENQUIRY_STATUS[status].label.toLowerCase()}.`)
    } catch (err) { toast.error(errorMessage(err)) }
  }
  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await AdminAPI.enquiries.update(e.id, { notes })
      onChange(res.data)
      toast.success('Notes saved.')
    } catch (err) { toast.error(errorMessage(err)) } finally { setSavingNotes(false) }
  }

  const details = [
    ['Company', e.company], ['Mobile', e.phone], ['Email', e.email], ['Voltage', e.voltage],
    ['Equipment', e.equipment], ['Site location', e.location], ['Received', formatDate(e.created_at, true)],
  ]

  return (
    <Modal open onClose={onClose} variant="drawer" size="lg" title={e.name} subtitle={e.company || 'Project enquiry'}
      footer={(
        <>
          <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={() => onDelete(e)}><Icon name="trash" size={16} />Delete</button>
          <span className="adm-grow" />
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Close</button>
        </>
      )}>
      <div className="adm-enquiry">
        <div className="adm-enquiry__actions">
          <a className="adm-btn adm-btn--primary" href={telHref(e.phone)}><Icon name="phone" size={16} />Call</a>
          <a className="adm-btn adm-btn--whatsapp" href={whatsappHref(e.phone.replace(/^0/, '91'), `Hello ${e.name}, thank you for your enquiry with ARUL ELECTRICAL.`)} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={16} />WhatsApp</a>
          {e.email && <a className="adm-btn adm-btn--soft" href={`mailto:${e.email}?subject=${encodeURIComponent('Your enquiry with ARUL ELECTRICAL')}`}><Icon name="mail" size={16} />Email</a>}
        </div>

        <div className="adm-enquiry__status">
          <span className="adm-field__label">Status</span>
          <div className="adm-segment adm-segment--wide">
            {Object.entries(ENQUIRY_STATUS).map(([k, v]) => (
              <button key={k} type="button" className={e.status === k ? 'is-active' : ''} onClick={() => setStatus(k)}>{v.label}</button>
            ))}
          </div>
        </div>

        <dl className="adm-meta adm-meta--rows">
          {details.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>

        <div className="adm-enquiry__msg">
          <span className="adm-field__label">Project scope / requirements</span>
          <p>{e.message || <i className="adm-muted">No message provided.</i>}</p>
        </div>

        <label className="adm-field">
          <span className="adm-field__label">Internal notes <small>(only visible to admins)</small></span>
          <textarea className="adm-input" rows={3} value={notes} onChange={(ev) => setNotes(ev.target.value)} placeholder="e.g. Called on Monday, site visit fixed for Friday…" />
        </label>
        <button type="button" className="adm-btn adm-btn--soft" onClick={saveNotes} disabled={savingNotes || notes === (e.notes || '')}>
          {savingNotes ? <Spinner size={14} /> : <Icon name="save" size={15} />}Save notes
        </button>
      </div>
    </Modal>
  )
}

export default function ContactEnquiries() {
  const toast = useToast()
  const confirm = useConfirm()
  const { refreshCounts } = useAdminShell()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [active, setActive] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await AdminAPI.enquiries.list({ status, q: q.trim() || undefined })
      setData(res.data)
      setError(null)
      return res.data
    } catch (e) { setError(errorMessage(e)) }
  }, [status, q])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  const open = useCallback(async (item) => {
    setActive(item)
    if (item.status === 'new') {
      try {
        const res = await AdminAPI.enquiries.update(item.id, { status: 'read' })
        setActive(res.data)
        setData((d) => d && ({ ...d, items: d.items.map((x) => (x.id === item.id ? res.data : x)), counts: { ...d.counts, new: d.counts.new - 1, read: d.counts.read + 1 } }))
        refreshCounts()
      } catch { /* ignore */ }
    }
  }, [refreshCounts])

  // open an enquiry from a dashboard link (?open=ID)
  useEffect(() => {
    const id = Number(params.get('open'))
    if (!id || !data) return
    const item = data.items.find((x) => x.id === id)
    if (item) open(item)
    setParams({}, { replace: true })
  }, [params, data, open, setParams])

  const onChange = (row) => {
    setActive(row)
    load()
    refreshCounts()
  }

  const onDelete = async (e) => {
    const ok = await confirm({ title: 'Delete this enquiry?', message: <>The enquiry from <b>{e.name}</b> will be permanently deleted. This cannot be undone.</>, confirmText: 'Delete', danger: true })
    if (!ok) return
    try {
      await AdminAPI.enquiries.remove(e.id)
      toast.success('Enquiry deleted.')
      setActive(null)
      load()
      refreshCounts()
    } catch (err) { toast.error(errorMessage(err)) }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await AdminAPI.enquiries.exportCsv()
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { toast.error(errorMessage(e)) } finally { setExporting(false) }
  }

  if (error && !data) return <ErrorState message={error} onRetry={load} />
  if (!data) return <PageLoading />

  const tabs = [['all', 'All'], ...Object.entries(ENQUIRY_STATUS).map(([k, v]) => [k, v.label])]

  return (
    <div className="adm-page">
      <PageHeader icon="inbox" title="Enquiries" description="Project enquiries sent from the website contact form.">
        <button type="button" className="adm-btn adm-btn--soft" onClick={exportCsv} disabled={exporting || !data.counts.all}>
          {exporting ? <Spinner size={14} /> : <Icon name="download" size={16} />}Export to Excel (CSV)
        </button>
      </PageHeader>

      <div className="adm-list-toolbar adm-list-toolbar--plain">
        <div className="adm-chips">
          {tabs.map(([k, label]) => (
            <button key={k} type="button" className={`adm-chip ${status === k ? 'is-active' : ''}`} onClick={() => setStatus(k)}>
              {label}<span>{data.counts[k] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="adm-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, company…" />
        </div>
      </div>

      {data.items.length === 0 ? (
        <EmptyState icon="inbox" title={q || status !== 'all' ? 'No matching enquiries' : 'No enquiries yet'}
          text={q || status !== 'all' ? 'Try a different filter or search.' : 'Enquiries submitted on the website will appear here.'} />
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--enquiries">
            <thead>
              <tr><th>Customer</th><th>Contact</th><th>Requirement</th><th>Received</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.id} className={`is-clickable ${e.status === 'new' ? 'is-new' : ''}`} onClick={() => open(e)}>
                  <td data-label="Customer">
                    <div className="adm-cell-person">
                      <span className="adm-avatar adm-avatar--soft">{e.name?.[0]?.toUpperCase()}</span>
                      <span><b>{e.name}</b><small>{e.company || '—'}</small></span>
                    </div>
                  </td>
                  <td data-label="Contact"><span>{e.phone}</span><small>{e.email}</small></td>
                  <td data-label="Requirement"><span>{e.equipment || '—'}</span><small>{[e.voltage, e.location].filter(Boolean).join(' · ')}</small></td>
                  <td data-label="Received"><span>{timeAgo(e.created_at)}</span><small>{formatDate(e.created_at)}</small></td>
                  <td data-label="Status"><Badge tone={ENQUIRY_STATUS[e.status]?.tone} dot={e.status === 'new'}>{ENQUIRY_STATUS[e.status]?.label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && <EnquiryDrawer enquiry={active} onClose={() => setActive(null)} onChange={onChange} onDelete={onDelete} />}
    </div>
  )
}
