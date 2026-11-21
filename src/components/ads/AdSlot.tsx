import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchActiveAd, recordAdEvent, type AdPlacement } from '@/services/advertisements'
import type { AdvertisementRow } from '@/types'

export function AdSlot({ placement, className = '' }: { readonly placement: AdPlacement; readonly className?: string }) {
  const [ad, setAd] = useState<AdvertisementRow | null>(null)
  const [loaded, setLoaded] = useState(false)
  const element = useRef<HTMLElement | null>(null)
  const impressionSent = useRef(false)
  const location = useLocation()
  useEffect(() => { impressionSent.current = false }, [ad?.id, location.pathname])
  useEffect(() => { let active = true; setLoaded(false); fetchActiveAd(placement).then((item) => { if (active) setAd(item) }).catch(() => { if (active) setAd(null) }); return () => { active = false } }, [placement])
  useEffect(() => {
    if (!ad || !loaded || impressionSent.current || !element.current) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
        impressionSent.current = true
        void recordAdEvent('ad_impression', ad.id, location.pathname).catch(() => {})
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(element.current)
    return () => observer.disconnect()
  }, [ad, loaded, location.pathname])
  if (!ad) return null
  let destination: URL
  let image: URL
  try { destination = new URL(ad.target_url); image = new URL(ad.image_url); if (destination.protocol !== 'https:' || image.protocol !== 'https:') return null } catch { return null }
  return <aside ref={(node) => { element.current = node }} aria-label={`Publicidad: ${ad.advertiser_name}`} className={`mx-auto w-full max-w-6xl ${className}`}>
    <p className="mb-1 text-center text-[9px] uppercase tracking-[0.18em] text-ink-muted">Publicidad</p>
    <a href={destination.toString()} target="_blank" rel="sponsored noopener noreferrer" onClick={() => void recordAdEvent('ad_click', ad.id, location.pathname).catch(() => {})} className="group block overflow-hidden border border-rule bg-paper-strong">
      <img src={image.toString()} alt={ad.title} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setAd(null)} className="max-h-64 w-full object-contain transition-opacity group-hover:opacity-90" />
      <span className="sr-only">Patrocinado por {ad.advertiser_name}</span>
    </a>
  </aside>
}
