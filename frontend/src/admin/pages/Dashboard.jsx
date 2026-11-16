import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminAPI } from '../../api/endpoints'
import useFetch from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { PageLoading, ErrorState, Badge, Card, Notice, EmptyState } from '../components/ui'
import Icon from '../../components/common/Icon'
import { CONTENT_ORDER, PAGES, COLLECTIONS, COLLECTION_PAGE } from '../config/content'
import { ENQUIRY_STATUS } from '../../utils/constants'
import { formatBytes, timeAgo } from '../../utils/helpers'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/* 14-day enquiry bar chart (pure CSS) */
function EnquiryChart({ data }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.count))
  const total = data.reduce((s, d) => s + d.count, 0)
  const label = (d) => new Date(d.date + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const shown = hover ?? data.length - 1
  return (
    <div className="adm-chart">
      <div className="adm-chart__summary">
        <div><b>{total}</b><span>enquiries in the last 14 days</span></div>
        <div className="adm-chart__hover"><b>{data[shown].count}</b><span>{hover === null ? 'today' : label(data[shown])}</span></div>
      </div>
      <div className="adm-chart__bars" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <button type="button" key={d.date} className={`adm-chart__bar ${i === shown ? 'is-active' : ''}`} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}
            aria-label={`${label(d)}: ${d.count} enquiries`}>
            <i style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }} className={d.count ? '' : 'is-zero'} />
          </button>
        ))}
      </div>
      <div className="adm-chart__axis"><span>{label(data[0])}</span><span>{label(data[6])}</span><span>Today</span></div>
    </div>
  )
}

function StatusBreakdown({ byStatus }) {
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
  const colors = { new: 'var(--a-yellow)', read: 'var(--a-violet)', replied: 'var(--a-green)', closed: '#b9b4c7' }
  return (
    <div className="adm-breakdown">
      <div className="adm-breakdown__bar">
        {total === 0 ? <i style={{ flex: 1, background: '#eee' }} /> : Object.entries(byStatus).map(([k, v]) => v > 0 && <i key={k} style={{ flex: v, background: colors[k] }} title={`${ENQUIRY_STATUS[k].label}: ${v}`} />)}
      </div>
      <ul>
        {Object.entries(byStatus).map(([k, v]) => (
          <li key={k}>
            <Link to={`/admin/enquiries`}><span className="adm-breakdown__dot" style={{ background: colors[k] }} />{ENQUIRY_STATUS[k].label}<b>{v}</b></Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Checklist({ items }) {
  const required = items.filter((i) => !i.optional)
  const done = required.filter((i) => i.done).length
  const pct = Math.round((done / required.length) * 100)
  return (
    <div className="adm-checklist">
      <div className="adm-checklist__progress">
        <div className="adm-ring" style={{ '--p': pct }}><span>{pct}%</span></div>
        <div>
          <b>{done === required.length ? 'Website is fully set up 🎉' : `${required.length - done} thing${required.length - done > 1 ? 's' : ''} left to set up`}</b>
          <small>{done} of {required.length} essentials done</small>
        </div>
      </div>
      <ul>
        {items.map((c) => (
          <li key={c.key} className={c.done ? 'is-done' : ''}>
            <span className="adm-checklist__tick"><Icon name={c.done ? 'check' : c.optional ? 'info' : 'x'} size={13} strokeWidth={3} /></span>
            <span className="adm-checklist__label">{c.label}{c.optional && <small> (optional)</small>}</span>
            {!c.done && <Link to={c.to} className="adm-link">Set up<Icon name="arrow-right" size={13} /></Link>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Dashboard() {
  const { admin } = useAuth()
  const { data, loading, error, reload } = useFetch(() => AdminAPI.dashboard().then((r) => r.data))

  if (loading) return <PageLoading />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const s = data.stats
  const stats = [
    { label: 'New enquiries', value: s.enquiries_new, icon: 'inbox', to: '/admin/enquiries', tone: 'yellow', hint: `${s.enquiries_total} received in total` },
    { label: 'Enquiries this week', value: s.enquiries_week, icon: 'activity', to: '/admin/enquiries', tone: 'violet', hint: 'Last 7 days' },
    { label: 'Services live', value: s.services, icon: 'wrench', to: '/admin/services', tone: 'violet', hint: `${s.projects} projects live` },
    { label: 'Media files', value: s.media, icon: 'image', to: '/admin/media', tone: 'violet', hint: `${formatBytes(s.media_size)} used` },
  ]

  const quick = [
    { label: 'Hero slider', icon: 'home', to: '/admin/hero' },
    { label: 'Add a project', icon: 'factory', to: '/admin/projects' },
    { label: 'Upload images', icon: 'upload', to: '/admin/media' },
    { label: 'Contact & WhatsApp', icon: 'phone', to: '/admin/settings' },
    { label: 'Edit services', icon: 'wrench', to: '/admin/services' },
    { label: 'Email settings', icon: 'mail', to: '/admin/settings?tab=email' },
  ]

  return (
    <div className="adm-page">
      <div className="adm-welcome">
        <div>
          <span className="adm-welcome__date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <h1>{greeting()}, {admin?.name?.split(' ')[0] || 'Admin'} 👋</h1>
          <p>{s.enquiries_new > 0 ? `You have ${s.enquiries_new} new enquir${s.enquiries_new > 1 ? 'ies' : 'y'} waiting for a reply.` : 'All caught up — no new enquiries right now.'}</p>
        </div>
        <div className="adm-welcome__actions">
          {s.enquiries_new > 0 && <Link to="/admin/enquiries" className="adm-btn adm-btn--yellow"><Icon name="inbox" size={16} />View new enquiries</Link>}
          <a href="/" target="_blank" rel="noreferrer" className="adm-btn adm-btn--glass"><Icon name="external-link" size={16} />Open website</a>
        </div>
      </div>

      {!data.mail?.configured && (
        <Notice tone="warning" icon="mail" action={<Link to="/admin/settings?tab=email" className="adm-btn adm-btn--sm adm-btn--primary">Set up email</Link>}>
          <b>Enquiry emails are not set up yet.</b> Enquiries are saved here, but no email is sent to {data.mail?.notify_to || 'your inbox'} until SMTP details are added.
        </Notice>
      )}
      {data.mail?.configured && data.mail?.last_error && (
        <Notice tone="warning" icon="alert" action={<Link to="/admin/settings?tab=email" className="adm-btn adm-btn--sm adm-btn--primary">Check settings</Link>}>
          <b>Last enquiry email failed:</b> {data.mail.last_error}
        </Notice>
      )}

      <div className="adm-stats">
        {stats.map((st) => (
          <Link key={st.label} to={st.to} className={`adm-stat adm-stat--${st.tone}`}>
            <span className="adm-stat__icon"><Icon name={st.icon} size={20} /></span>
            <span className="adm-stat__value">{st.value}</span>
            <span className="adm-stat__label">{st.label}</span>
            <span className="adm-stat__hint">{st.hint}<Icon name="arrow-right" size={13} /></span>
          </Link>
        ))}
      </div>

      <div className="adm-dash-grid">
        <div className="adm-stack">
          <Card title="Enquiry activity" icon="activity" description="Hover a bar to see the day.">
            <EnquiryChart data={data.chart} />
            <StatusBreakdown byStatus={data.by_status} />
          </Card>

          <Card title="Latest enquiries" icon="inbox" actions={<Link to="/admin/enquiries" className="adm-link">View all<Icon name="arrow-right" size={14} /></Link>}>
            {data.recent_enquiries.length === 0 ? (
              <EmptyState icon="inbox" title="No enquiries yet" text="When visitors send the project enquiry form, they appear here." />
            ) : (
              <ul className="adm-recent">
                {data.recent_enquiries.map((e) => (
                  <li key={e.id}>
                    <Link to={`/admin/enquiries?open=${e.id}`}>
                      <span className="adm-avatar adm-avatar--soft">{e.name?.[0]?.toUpperCase()}</span>
                      <span className="adm-recent__main">
                        <b>{e.name}{e.company && <small> · {e.company}</small>}</b>
                        <small>{e.equipment || 'General enquiry'} · {e.phone}</small>
                      </span>
                      <span className="adm-recent__side">
                        <Badge tone={ENQUIRY_STATUS[e.status]?.tone} dot={e.status === 'new'}>{ENQUIRY_STATUS[e.status]?.label}</Badge>
                        <small>{timeAgo(e.created_at)}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Website content" icon="layers" description="How many cards are live in each section.">
            <div className="adm-content-grid">
              {Object.entries(data.content).map(([key, c]) => {
                const pageKey = COLLECTION_PAGE[key]
                const page = PAGES[pageKey]
                const hidden = data.sections[page?.sectionKey]?.is_visible === false
                return (
                  <Link key={key} to={`/admin/${page.path}`} className="adm-content-tile">
                    <span className="adm-content-tile__icon"><Icon name={page.icon} size={18} /></span>
                    <span className="adm-content-tile__name">{COLLECTIONS[key].plural}</span>
                    <b>{c.live}<small>/{c.total}</small></b>
                    <span className="adm-content-tile__meta">{hidden ? <Badge tone="gray">Section hidden</Badge> : c.total === 0 ? <Badge tone="yellow">Empty</Badge> : <Badge tone="green" dot>Live</Badge>}</span>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="adm-stack">
          <Card title="Quick actions" icon="zap">
            <div className="adm-quick">
              {quick.map((q) => (
                <Link key={q.label} to={q.to} className="adm-quick__item">
                  <span><Icon name={q.icon} size={18} /></span>{q.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Website setup" icon="check-circle">
            <Checklist items={data.checklist} />
          </Card>

          <Card title="Homepage sections" icon="list" description="In the order they appear on the website.">
            <ul className="adm-sections">
              {CONTENT_ORDER.map((key, i) => {
                const p = PAGES[key]
                const st = data.sections[p.sectionKey]
                return (
                  <li key={key}>
                    <Link to={`/admin/${p.path}`}>
                      <span className="adm-sections__num">{i + 1}</span>
                      <Icon name={p.icon} size={16} />
                      <span>{p.title}</span>
                      {st && !st.is_visible ? <Badge tone="gray">Hidden</Badge> : <Badge tone="green" dot>Live</Badge>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
