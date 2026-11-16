import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SETTINGS_PAGE } from '../config/content'
import { useSection, SaveBar } from './SectionPage'
import { useConfirm } from '../components/Confirm'
import { useToast } from '../components/Toast'
import { useAdminShell } from '../AdminLayout'
import { useUnsavedGuard } from '../../hooks/useFetch'
import { PageHeader, Card, PageLoading, ErrorState, Notice, Switch, Spinner, Badge } from '../components/ui'
import { SchemaForm, FieldRenderer } from '../components/FormFields'
import Icon from '../../components/common/Icon'
import { AdminAPI } from '../../api/endpoints'
import { errorMessage, fieldErrors } from '../../api/axiosInstance'
import { formatDate } from '../../utils/helpers'

const PROVIDERS = {
  hostinger: { label: 'Hostinger', host: 'smtp.hostinger.com', port: 465, encryption: 'ssl' },
  gmail: { label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 465, encryption: 'ssl' },
  zoho: { label: 'Zoho Mail (India)', host: 'smtp.zoho.in', port: 465, encryption: 'ssl' },
  outlook: { label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, encryption: 'tls' },
  godaddy: { label: 'GoDaddy', host: 'smtpout.secureserver.net', port: 465, encryption: 'ssl' },
}

/* ---------------- Email & SMTP ---------------- */
function MailSettings() {
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      const res = await AdminAPI.mail.get()
      setForm(res.data)
      setSaved(JSON.stringify(res.data))
      setTestTo(res.data.notify_to?.split(',')[0]?.trim() || '')
    } catch (e) { setError(errorMessage(e)) }
  }
  useEffect(() => { load() }, [])

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!form) return <PageLoading rows={2} />

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const dirty = JSON.stringify(form) !== saved

  const save = async () => {
    setSaving(true)
    setErrors({})
    try {
      const res = await AdminAPI.mail.save(form)
      setForm(res.data)
      setSaved(JSON.stringify(res.data))
      toast.success(res.message)
    } catch (e) {
      setErrors(fieldErrors(e))
      toast.error(errorMessage(e))
    } finally { setSaving(false) }
  }

  const test = async () => {
    if (dirty) return toast.error('Save your changes first, then send a test email.')
    setTesting(true)
    try {
      const res = await AdminAPI.mail.test(testTo)
      toast.success(res.message)
      load()
    } catch (e) {
      toast.error(errorMessage(e))
      load()
    } finally { setTesting(false) }
  }

  const applyProvider = (key) => {
    const p = PROVIDERS[key]
    if (p) setForm((f) => ({ ...f, host: p.host, port: p.port, encryption: p.encryption }))
  }

  const field = (f) => <FieldRenderer field={f} value={form[f.name]} error={errors[f.name]} onChange={set(f.name)} />

  return (
    <div className="adm-stack">
      <Card title="Enquiry notifications" icon="mail" description="Where website enquiries are emailed."
        actions={form.configured ? <Badge tone="green" dot>Active</Badge> : <Badge tone="yellow" dot>Not set up</Badge>}>
        {!form.configured && (
          <Notice tone="warning">Emails are <b>not being sent</b> yet. Enquiries are still saved in the admin panel. Fill in the SMTP details below and send a test email.</Notice>
        )}
        {form.last_error && <Notice tone="warning" icon="alert"><b>Last attempt failed:</b> {form.last_error}</Notice>}
        {form.last_sent_at && !form.last_error && <Notice tone="success" icon="check-circle">Last email sent successfully on {formatDate(form.last_sent_at, true)}.</Notice>}
        <div className="adm-form-grid">
          <div className="adm-field adm-field--toggle">
            <Switch checked={form.enabled} onChange={set('enabled')} label="Send an email for every new enquiry" />
          </div>
          {field({ name: 'notify_to', label: 'Send enquiries to', required: true, help: 'Separate several addresses with commas.' })}
          <div className="adm-field adm-field--toggle">
            <Switch checked={form.send_confirmation} onChange={set('send_confirmation')} label="Also send a “thank you” email to the customer" />
            <p className="adm-field__help">Only when the customer enters an email address.</p>
          </div>
        </div>
      </Card>

      <Card title="SMTP server (outgoing mail)" icon="settings" description="Ask your email/hosting provider for these details.">
        <div className="adm-form-grid">
          <label className="adm-field">
            <span className="adm-field__label">Quick setup — choose your email provider</span>
            <select className="adm-input" defaultValue="" onChange={(e) => { applyProvider(e.target.value); e.target.value = '' }}>
              <option value="">Select to fill host, port & encryption…</option>
              {Object.entries(PROVIDERS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </label>
          {field({ name: 'host', label: 'SMTP host', half: true, placeholder: 'e.g. smtp.hostinger.com' })}
          {field({ name: 'port', label: 'Port', half: true, placeholder: '465' })}
          {field({ name: 'encryption', label: 'Encryption', type: 'select', half: true, options: [{ value: 'ssl', label: 'SSL (port 465)' }, { value: 'tls', label: 'STARTTLS (port 587)' }, { value: 'none', label: 'None (port 25)' }] })}
          {field({ name: 'username', label: 'SMTP username', half: true, help: 'Usually your full email address.' })}
          {field({ name: 'password', label: 'SMTP password', type: 'password', half: true, autoComplete: 'new-password',
            placeholder: form.has_password ? '•••••••• (saved — leave blank to keep)' : 'Enter password',
            help: 'Stored encrypted. Gmail needs an “App password”.' })}
          {field({ name: 'from_email', label: '“From” email address', type: 'email', half: true, help: 'Should match the SMTP account.' })}
          {field({ name: 'from_name', label: '“From” name', half: true })}
          <div className="adm-field adm-field--toggle is-half">
            <Switch checked={form.skip_ssl_verify} onChange={set('skip_ssl_verify')} label="Skip SSL certificate check" />
            <p className="adm-field__help">Turn on only if the test fails with a certificate error (common on local XAMPP).</p>
          </div>
        </div>
      </Card>

      <Card title="Send a test email" icon="zap" description="Save first, then check that emails really arrive.">
        <div className="adm-test-mail">
          <input className="adm-input" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
          <button type="button" className="adm-btn adm-btn--yellow" onClick={test} disabled={testing || !form.host}>
            {testing ? <><Spinner size={14} />Sending…</> : <><Icon name="mail" size={16} />Send test email</>}
          </button>
        </div>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => { setForm(JSON.parse(saved)); setErrors({}) }} />
    </div>
  )
}

/* ---------------- Google result preview ---------------- */
function SeoPreview({ v }) {
  const title = v.meta_title || v.site_name || 'Your website title'
  const desc = v.meta_description || 'Add a description so people know what you do before they click.'
  const len = (s, max) => <span className={(s || '').length > max ? 'is-over' : ''}>{(s || '').length}/{max}</span>
  const keywords = (v.meta_keywords || '').split(',').map((k) => k.trim()).filter(Boolean)
  return (
    <Card title="How it looks on Google" icon="search" className="adm-seo-card">
      <div className="adm-seo">
        <div className="adm-seo__url"><span className="adm-seo__fav">{(v.site_name || 'A')[0]}</span>{window.location.host} › home</div>
        <div className="adm-seo__title">{title.length > 62 ? title.slice(0, 60) + '…' : title}</div>
        <div className="adm-seo__desc">{desc.length > 162 ? desc.slice(0, 160) + '…' : desc}</div>
      </div>
      <div className="adm-seo__meta">
        <span>Title {len(v.meta_title, 60)}</span>
        <span>Description {len(v.meta_description, 160)}</span>
        <span>{keywords.length} keyword{keywords.length === 1 ? '' : 's'}</span>
      </div>
      {keywords.length > 0 && <div className="adm-seo__tags">{keywords.map((k) => <Badge key={k} tone="violet">{k}</Badge>)}</div>}
    </Card>
  )
}

/* ---------------- Page ---------------- */
export default function SiteSettings() {
  const page = SETTINGS_PAGE
  const section = useSection(page.sectionKey)
  const confirm = useConfirm()
  const { refreshBranding } = useAdminShell()
  const [params, setParams] = useSearchParams()
  const tabs = useMemo(() => [...page.tabs, { title: 'Email & SMTP', icon: 'mail', key: 'email' }], [page])
  const initial = Math.max(0, tabs.findIndex((t) => t.key === params.get('tab')))
  const [tab, setTab] = useState(initial)
  useUnsavedGuard(section.dirty, confirm)

  if (section.loading) return <PageLoading />
  if (section.error) return <ErrorState message={section.error} onRetry={section.reload} />

  const current = tabs[tab]
  const allFields = page.tabs.flatMap((t) => t.fields)

  const go = (i) => {
    setTab(i)
    setParams(tabs[i].key ? { tab: tabs[i].key } : {}, { replace: true })
  }

  return (
    <div className="adm-page">
      <PageHeader icon={page.icon} title={page.title} description={page.description} />

      <div className="adm-settings">
        <nav className="adm-settings__nav">
          {tabs.map((t, i) => (
            <button key={t.title} type="button" className={tab === i ? 'is-active' : ''} onClick={() => go(i)}>
              <Icon name={t.icon} size={17} />{t.title}
            </button>
          ))}
        </nav>

        <div className="adm-settings__body">
          {current.key === 'email' ? <MailSettings /> : (
            <>
              <Card title={current.title} icon={current.icon}>
                <SchemaForm fields={current.fields} values={section.values} errors={section.errors} onChange={section.setValues} />
              </Card>
              {current.seoPreview && <SeoPreview v={section.values} />}
              <SaveBar dirty={section.dirty} saving={section.saving} updatedAt={section.updatedAt}
                onSave={async () => { const ok = await section.save(allFields.filter((f) => f.required)); if (ok) refreshBranding() }}
                onDiscard={section.discard} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
