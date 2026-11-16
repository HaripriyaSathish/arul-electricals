/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from './components/Confirm'
import { useToast } from './components/Toast'
import { AdminAPI } from '../api/endpoints'
import { useFavicon } from '../hooks/useFetch'
import './AdminLayout.css'

const AdminShell = createContext({ refreshCounts: () => {}, refreshBranding: () => {} })
export const useAdminShell = () => useContext(AdminShell)

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [newEnquiries, setNewEnquiries] = useState(0)
  const [branding, setBranding] = useState(null)

  useFavicon(branding?.favicon || branding?.logo)

  const refreshCounts = useCallback(() => {
    AdminAPI.enquiries.list({ status: 'new' }).then((r) => setNewEnquiries(r.data.counts.new)).catch(() => {})
  }, [])
  const refreshBranding = useCallback(() => {
    AdminAPI.sections.get('settings').then((r) => setBranding(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    refreshCounts()
    refreshBranding()
    const t = setInterval(refreshCounts, 60000)
    return () => clearInterval(t)
  }, [refreshCounts, refreshBranding])

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => { document.title = 'Admin · ' + (branding?.site_name || 'ARUL ELECTRICAL') }, [branding])

  const onLogout = async () => {
    const ok = await confirm({ title: 'Log out?', message: 'You will need your username and password to sign in again.', confirmText: 'Log out', icon: 'log-out' })
    if (!ok) return
    await logout()
    toast.success('You have been logged out.')
    navigate('/admin/login', { replace: true })
  }

  return (
    <AdminShell.Provider value={{ refreshCounts, refreshBranding, branding }}>
      <div className="adm-app">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} newEnquiries={newEnquiries} branding={branding} onLogout={onLogout} />
        <div className="adm-main">
          <Topbar onMenu={() => setMenuOpen(true)} admin={admin} newEnquiries={newEnquiries} onLogout={onLogout} />
          <main className="adm-content">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminShell.Provider>
  )
}
