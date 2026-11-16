import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { errorMessage } from '../../api/axiosInstance'
import { PublicAPI } from '../../api/endpoints'
import Icon from '../../components/common/Icon'
import { Spinner } from '../components/ui'
import { mediaUrl } from '../../utils/helpers'
import { useFavicon } from '../../hooks/useFetch'
import '../admin.css'

export default function Login() {
  const { admin, login, checking } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [brand, setBrand] = useState(null)

  useEffect(() => {
    document.title = 'Admin Login · ARUL ELECTRICAL'
    PublicAPI.site().then((r) => setBrand({ settings: r.data.settings, hero: r.data.sections.hero?.data })).catch(() => {})
  }, [])
  useFavicon(brand?.settings?.favicon || brand?.settings?.logo)

  if (!checking && admin) return <Navigate to={location.state?.from || '/admin'} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password) return setError('Please enter your username and password.')
    setBusy(true)
    setError('')
    try {
      await login(form.username.trim(), form.password)
      navigate(location.state?.from || '/admin', { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Login failed.'))
    } finally {
      setBusy(false)
    }
  }

  const s = brand?.settings || {}
  const bg = brand?.hero?.image

  return (
    <div className="adm-login">
      <div className="adm-login__art" style={bg ? { backgroundImage: `linear-gradient(160deg, rgba(49,0,95,.92), rgba(89,0,168,.78)), url(${mediaUrl(bg)})` } : undefined}>
        <div className="adm-login__brand">
          <span className="adm-login__logo">{s.logo ? <img src={mediaUrl(s.logo)} alt="" /> : <Icon name="zap" size={26} />}</span>
          <div>
            <b>{s.site_name || 'ARUL ELECTRICAL'}</b>
            <small>{s.tagline || 'A-Grade Electrical Contractors & Consultants'}</small>
          </div>
        </div>
        <div className="adm-login__pitch">
          <span className="adm-login__eyebrow"><Icon name="zap" size={14} />Website Admin Panel</span>
          <h1>Manage your website in minutes.</h1>
          <ul>
            <li><Icon name="check-circle" size={18} />Edit every section — text, images and buttons</li>
            <li><Icon name="image" size={18} />One media library for all website images</li>
            <li><Icon name="inbox" size={18} />Track project enquiries from customers</li>
          </ul>
        </div>
        <small className="adm-login__foot">© {new Date().getFullYear()} {s.site_name || 'ARUL ELECTRICAL'}</small>
      </div>

      <div className="adm-login__panel">
        <form className="adm-login__form" onSubmit={submit} noValidate>
          <div className="adm-login__lock"><Icon name="lock" size={22} /></div>
          <h2>Welcome back</h2>
          <p className="adm-login__sub">Sign in to manage the website.</p>

          {error && <div className="adm-login__error" role="alert"><Icon name="alert" size={16} />{error}</div>}

          <label className="adm-field">
            <span className="adm-field__label">Username</span>
            <div className="adm-input-wrap has-icon">
              <Icon name="user" size={16} className="adm-input-wrap__icon" />
              <input className="adm-input" autoFocus autoComplete="username" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Enter username" />
            </div>
          </label>

          <label className="adm-field">
            <span className="adm-field__label">Password</span>
            <div className="adm-input-wrap has-icon has-action">
              <Icon name="lock" size={16} className="adm-input-wrap__icon" />
              <input className="adm-input" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" />
              <button type="button" className="adm-input-wrap__action" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
                <Icon name={show ? 'eye-off' : 'eye'} size={17} />
              </button>
            </div>
          </label>

          <button type="submit" className="adm-btn adm-btn--primary adm-btn--block adm-btn--lg" disabled={busy || checking}>
            {busy ? <><Spinner size={16} light />Signing in…</> : <>Sign in<Icon name="arrow-right" size={17} /></>}
          </button>

          <a href="/" className="adm-login__back"><Icon name="chevron-left" size={15} />Back to website</a>
        </form>
      </div>
    </div>
  )
}
