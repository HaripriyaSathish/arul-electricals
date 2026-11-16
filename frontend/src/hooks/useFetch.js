import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { errorMessage } from '../api/axiosInstance'
import { mediaUrl } from '../utils/helpers'

/**
 * Runs an async loader on mount. Returns { data, setData, loading, error, reload }.
 */
export default function useFetch(loader, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await loaderRef.current()
      setData(res)
      return res
    } catch (e) {
      setError(errorMessage(e))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload() }, deps)

  return { data, setData, loading, error, reload }
}

/**
 * Warns before leaving a page with unsaved changes (in-app navigation and browser tab close).
 */
export function useUnsavedGuard(dirty, confirm) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    confirm({
      title: 'Leave without saving?',
      message: 'You have unsaved changes on this page. If you leave now they will be lost.',
      confirmText: 'Leave page',
      cancelText: 'Stay and save',
      danger: true,
      icon: 'alert',
    }).then((ok) => (ok ? blocker.proceed() : blocker.reset()))
  }, [blocker, confirm])

  useEffect(() => {
    if (!dirty) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
}

/** Sets the browser tab icon from a media path. */
export function useFavicon(path) {
  useEffect(() => {
    if (!path) return
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/png'
    link.href = mediaUrl(path)
  }, [path])
}
