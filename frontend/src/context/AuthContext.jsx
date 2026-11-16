/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AuthAPI } from '../api/endpoints'
import { clearToken, getToken, setToken } from '../api/axiosInstance'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [checking, setChecking] = useState(() => !!getToken())

  useEffect(() => {
    if (getToken()) {
      AuthAPI.me()
        .then((r) => setAdmin(r.data))
        .catch(() => clearToken())
        .finally(() => setChecking(false))
    }
    const onLogout = () => setAdmin(null)
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await AuthAPI.login(username, password)
    setToken(res.data.token)
    setAdmin(res.data.admin)
    return res
  }, [])

  const logout = useCallback(async () => {
    try { await AuthAPI.logout() } catch { /* already logged out */ }
    clearToken()
    setAdmin(null)
  }, [])

  const value = useMemo(() => ({ admin, setAdmin, checking, login, logout }), [admin, checking, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
