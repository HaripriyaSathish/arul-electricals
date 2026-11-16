import { NavLink } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import { CONTENT_ORDER, PAGES } from '../config/content'
import { mediaUrl } from '../../utils/helpers'

export default function Sidebar({ open, onClose, newEnquiries = 0, branding, onLogout }) {
  const link = ({ isActive }) => `adm-nav__link ${isActive ? 'is-active' : ''}`

  return (
    <>
      <div className={`adm-sidebar__scrim ${open ? 'is-open' : ''}`} onClick={onClose} />
      <aside className={`adm-sidebar ${open ? 'is-open' : ''}`} aria-label="Admin navigation">
        <div className="adm-brand">
          <span className="adm-brand__logo">
            {branding?.logo ? <img src={mediaUrl(branding.logo)} alt="" /> : <Icon name="zap" size={20} />}
          </span>
          <div>
            <b>{branding?.site_name || 'ARUL ELECTRICAL'}</b>
            <small>Admin Panel</small>
          </div>
          <button type="button" className="adm-icon-btn adm-sidebar__close" onClick={onClose} aria-label="Close menu"><Icon name="x" /></button>
        </div>

        <nav className="adm-nav" onClick={onClose}>
          <div className="adm-nav__group">
            <NavLink end to="/admin" className={link}><Icon name="grid" size={18} />Dashboard</NavLink>
            <NavLink to="/admin/enquiries" className={link}>
              <Icon name="inbox" size={18} />Enquiries
              {newEnquiries > 0 && <span className="adm-nav__count">{newEnquiries}</span>}
            </NavLink>
            <NavLink to="/admin/media" className={link}><Icon name="image" size={18} />Media Library</NavLink>
          </div>

          <div className="adm-nav__group">
            <div className="adm-nav__title">Website content <small>top → bottom</small></div>
            {CONTENT_ORDER.map((key) => (
              <NavLink key={key} to={`/admin/${PAGES[key].path}`} className={link}>
                <Icon name={PAGES[key].icon} size={18} />{PAGES[key].title}
              </NavLink>
            ))}
          </div>

          <div className="adm-nav__group">
            <div className="adm-nav__title">Settings</div>
            <NavLink to="/admin/settings" className={link}><Icon name="settings" size={18} />Site Settings</NavLink>
            <NavLink to="/admin/legal" className={link}><Icon name="file-text" size={18} />Footer & Legal Pages</NavLink>
            <NavLink to="/admin/account" className={link}><Icon name="user" size={18} />My Account</NavLink>
          </div>
        </nav>

        <div className="adm-sidebar__foot">
          <a href="/" target="_blank" rel="noreferrer" className="adm-sidebar__site"><Icon name="external-link" size={16} />View live website</a>
          <button type="button" className="adm-sidebar__logout" onClick={onLogout}><Icon name="log-out" size={16} />Log out</button>
        </div>
      </aside>
    </>
  )
}
