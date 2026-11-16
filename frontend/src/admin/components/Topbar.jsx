import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import { CONTENT_ORDER, PAGES } from '../config/content'
import { initials } from '../../utils/helpers'

const STATIC = {
  '/admin': ['Dashboard'],
  '/admin/enquiries': ['Enquiries'],
  '/admin/media': ['Media Library'],
  '/admin/settings': ['Settings', 'Site Settings'],
  '/admin/account': ['Settings', 'My Account'],
}

function crumbs(pathname) {
  const clean = pathname.replace(/\/$/, '') || '/admin'
  if (STATIC[clean]) return STATIC[clean]
  if (clean === '/admin/legal') return ['Settings', PAGES.legal.title]
  const key = CONTENT_ORDER.find((k) => clean === `/admin/${PAGES[k].path}`)
  return key ? ['Website content', PAGES[key].title] : ['Admin']
}

export default function Topbar({ onMenu, admin, newEnquiries, onLogout }) {
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const ref = useRef(null)
  const trail = crumbs(pathname)

  useEffect(() => {
    if (!menu) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  return (
    <header className="adm-topbar">
      <button type="button" className="adm-icon-btn adm-topbar__menu" onClick={onMenu} aria-label="Open menu"><Icon name="menu" /></button>

      <nav className="adm-crumbs" aria-label="Breadcrumb">
        <Link to="/admin"><Icon name="home" size={15} /></Link>
        {trail.map((t, i) => (
          <span key={i} className={i === trail.length - 1 ? 'is-current' : ''}><Icon name="chevron-right" size={14} />{t}</span>
        ))}
      </nav>

      <div className="adm-topbar__right">
        <a className="adm-btn adm-btn--soft adm-btn--sm adm-topbar__site" href="/" target="_blank" rel="noreferrer">
          <Icon name="eye" size={15} /><span>View website</span>
        </a>
        <Link to="/admin/enquiries" className="adm-icon-btn adm-topbar__bell" title="Enquiries">
          <Icon name="inbox" size={19} />
          {newEnquiries > 0 && <span>{newEnquiries > 9 ? '9+' : newEnquiries}</span>}
        </Link>
        <div className="adm-usermenu" ref={ref}>
          <button type="button" className="adm-usermenu__btn" onClick={() => setMenu((m) => !m)}>
            <span className="adm-avatar">{initials(admin?.name || admin?.username)}</span>
            <span className="adm-usermenu__name">{admin?.name || admin?.username}</span>
            <Icon name="chevron-down" size={15} />
          </button>
          {menu && (
            <div className="adm-usermenu__pop" onClick={() => setMenu(false)}>
              <div className="adm-usermenu__who"><b>{admin?.name}</b><small>@{admin?.username}</small></div>
              <Link to="/admin/account"><Icon name="user" size={16} />My account</Link>
              <Link to="/admin/settings"><Icon name="settings" size={16} />Site settings</Link>
              <button type="button" onClick={onLogout}><Icon name="log-out" size={16} />Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
