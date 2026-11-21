import { useEffect, useState } from 'react'
import { fetchPublicLiveStreams, facebookEmbedUrl } from '@/services/liveStreams'
import type { LiveStreamRow } from '@/types'
import { Container } from '@/components/common/Container'

export function FacebookLiveSection() {
  const [items, setItems] = useState<LiveStreamRow[]>([])
  useEffect(() => { let active = true; fetchPublicLiveStreams().then((rows) => { if (active) setItems(rows) }).catch(() => {}); return () => { active = false } }, [])
  const live = items.find((item) => item.status === 'live')
  const next = items.find((item) => item.status === 'scheduled')
  const recent = !live && !next ? items.find((item) => item.status === 'finished') : null
  const featured = live ?? next ?? recent
  if (!featured) return null
  const embed = live ? facebookEmbedUrl(live.facebook_url) : null
  return <section className="border-b border-rule bg-night text-paper"><Container className="grid gap-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"><div>{live ? <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-light"><span className="h-2 w-2 animate-pulse rounded-full bg-brand-light" />En vivo</p> : <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-light">{next ? 'Próxima transmisión' : 'Transmisión reciente'}</p>}<h2 className="mt-2 font-serif text-3xl font-semibold">{featured.title}</h2>{featured.description && <p className="mt-2 max-w-2xl text-sm text-white/65">{featured.description}</p>}{next?.scheduled_at && <p className="mt-3 text-xs text-white/60">Programada: {new Date(next.scheduled_at).toLocaleString('es-SV')}</p>}{featured.facebook_url && <a href={featured.facebook_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs font-semibold text-brand-light underline">{live ? 'Ver transmisión en Facebook' : 'Abrir en Facebook'}</a>}</div>{embed && <div className="aspect-video overflow-hidden bg-black"><iframe title={`Facebook Live: ${featured.title}`} src={embed} className="h-full w-full" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen /></div>}</Container></section>
}
