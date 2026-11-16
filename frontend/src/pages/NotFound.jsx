import { Link } from 'react-router-dom'
import Icon from '../components/common/Icon'

export default function NotFound({ admin = false }) {
  return (
    <div className={admin ? 'adm-empty' : 'site-loader'}>
      <div className={admin ? '' : 'site-loader__error'}>
        <Icon name="alert" size={36} />
        <h2>Page not found</h2>
        <p>The page you are looking for doesn’t exist or was moved.</p>
        <Link to={admin ? '/admin' : '/'} className={admin ? 'adm-btn adm-btn--primary' : 'btn btn--primary'}>
          {admin ? 'Back to dashboard' : 'Go to homepage'}
        </Link>
      </div>
    </div>
  )
}
