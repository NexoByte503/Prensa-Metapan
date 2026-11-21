import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { recordPageView } from '@/services/analytics'

export function PageViewTracker() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (/^\/noticias\/[^/]+$/.test(pathname)) return
    void recordPageView(pathname).catch(() => {})
  }, [pathname])
  return null
}
