import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './components/ui'
import './admin.css'

export default function ProtectedRoute() {
  const { admin, checking } = useAuth()
  const location = useLocation()

  if (checking) {
    return (
      <div className="adm-fullscreen-loader">
        <Spinner size={34} />
        <p>Loading admin panel…</p>
      </div>
    )
  }
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
