/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../../components/common/Icon'

const ToastContext = createContext(null)

/**
 * toast.success(msg) → centred "success" pop-up with animated tick (auto closes)
 * toast.error(msg)   → corner notice (stays longer so it is not missed)
 * toast.info(msg)    → corner notice
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [popup, setPopup] = useState(null)
  const idRef = useRef(0)
  const popupTimer = useRef(null)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback((type, message) => {
    if (!message) return
    const id = ++idRef.current
    setToasts((t) => [...t.slice(-3), { id, type, message }])
    setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4000)
  }, [dismiss])

  const success = useCallback((message) => {
    if (!message) return
    clearTimeout(popupTimer.current)
    setPopup({ id: ++idRef.current, message })
    popupTimer.current = setTimeout(() => setPopup(null), 1900)
  }, [])

  useEffect(() => () => clearTimeout(popupTimer.current), [])

  const api = useMemo(() => ({
    success,
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push, success])

  return (
    <ToastContext.Provider value={api}>
      {children}

      {popup && (
        <div className="adm-success" role="status" aria-live="polite" onClick={() => setPopup(null)}>
          <div className="adm-success__card" key={popup.id}>
            <div className="adm-success__tick">
              <svg viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" fill="none" />
                <path fill="none" d="M15 27l7 7 15-15" />
              </svg>
            </div>
            <h3>Success!</h3>
            <p>{popup.message}</p>
          </div>
        </div>
      )}

      <div className="adm-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`adm-toast adm-toast--${t.type}`}>
            <Icon name={t.type === 'error' ? 'alert' : 'info'} size={18} />
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss"><Icon name="x" size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
