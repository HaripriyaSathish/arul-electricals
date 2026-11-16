import axios from 'axios'

// Local dev: http://localhost:8000 (frontend/.env). Production build: "" = same domain (frontend/.env.production).
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')
const TOKEN_KEY = 'ae_admin_token'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = (t) => {
  try { localStorage.setItem(TOKEN_KEY, t) } catch { /* storage unavailable */ }
}
export const clearToken = () => {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ }
}

const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 60000 })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('auth/login')) {
      clearToken()
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(err)
  },
)

/** Human friendly error text for any failed request. */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Make sure the PHP backend is running.'
  return err?.response?.data?.message || fallback
}

/** Field errors from a 422 response: { field: message } */
export function fieldErrors(err) {
  const e = err?.response?.data?.errors
  return e && typeof e === 'object' && !Array.isArray(e) ? e : {}
}

export default api
