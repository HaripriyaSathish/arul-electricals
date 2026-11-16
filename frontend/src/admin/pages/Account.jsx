import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AuthAPI } from '../../api/endpoints'
import { errorMessage, fieldErrors } from '../../api/axiosInstance'
import { useToast } from '../components/Toast'
import { PageHeader, Card, Spinner } from '../components/ui'
import { FieldRenderer } from '../components/FormFields'
import Icon from '../../components/common/Icon'
import { formatDate, initials } from '../../utils/helpers'

function strength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}
const LEVELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

export default function Account() {
  const { admin, setAdmin } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(admin?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [savingPw, setSavingPw] = useState(false)

  const saveName = async (e) => {
    e.preventDefault()
    setSavingName(true)
    try {
      const res = await AuthAPI.profile({ name })
      setAdmin((a) => ({ ...a, name }))
      toast.success(res.message)
    } catch (err) { toast.error(errorMessage(err)) } finally { setSavingName(false) }
  }

  const savePw = async (e) => {
    e.preventDefault()
    setErrors({})
    setSavingPw(true)
    try {
      const res = await AuthAPI.password(pw)
      setPw({ current_password: '', new_password: '', confirm_password: '' })
      toast.success(res.message)
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally { setSavingPw(false) }
  }

  const lvl = strength(pw.new_password)
  const pwField = (f) => <FieldRenderer field={{ type: 'password', autoComplete: f.name === 'current_password' ? 'current-password' : 'new-password', ...f }} value={pw[f.name]} error={errors[f.name]} onChange={(v) => setPw({ ...pw, [f.name]: v })} />

  return (
    <div className="adm-page adm-page--narrow">
      <PageHeader icon="user" title="My Account" description="Your admin profile and password." />

      <div className="adm-profile">
        <span className="adm-avatar adm-avatar--xl">{initials(admin?.name || admin?.username)}</span>
        <div>
          <h2>{admin?.name}</h2>
          <p>Username: <b>{admin?.username}</b></p>
          {admin?.last_login && <small>Previous login: {formatDate(admin.last_login, true)}</small>}
        </div>
      </div>

      <div className="adm-stack">
        <Card title="Display name" icon="user">
          <form onSubmit={saveName} className="adm-inline-form">
            <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <button type="submit" className="adm-btn adm-btn--primary" disabled={savingName || !name.trim() || name === admin?.name}>
              {savingName ? <Spinner size={14} light /> : <Icon name="save" size={16} />}Save
            </button>
          </form>
        </Card>

        <Card title="Change password" icon="lock" description="Use at least 8 characters. Other devices will be signed out.">
          <form onSubmit={savePw} className="adm-form-grid">
            {pwField({ name: 'current_password', label: 'Current password', required: true })}
            {pwField({ name: 'new_password', label: 'New password', required: true, half: true })}
            {pwField({ name: 'confirm_password', label: 'Confirm new password', required: true, half: true })}
            {pw.new_password && (
              <div className="adm-strength">
                <div className={`adm-strength__bar is-${lvl}`}><i /><i /><i /><i /></div>
                <span>{LEVELS[pw.new_password.length < 8 ? 0 : lvl]}</span>
              </div>
            )}
            <div className="adm-field">
              <button type="submit" className="adm-btn adm-btn--primary" disabled={savingPw || !pw.current_password || !pw.new_password}>
                {savingPw ? <><Spinner size={14} light />Updating…</> : <><Icon name="lock" size={16} />Update password</>}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
