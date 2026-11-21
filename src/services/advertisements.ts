import { getSupabaseClient } from '@/services/supabase'
import type { AdvertisementRow } from '@/types'

export const AD_PLACEMENTS = [
  { id: 'home_banner', label: 'Banner principal de inicio' },
  { id: 'header_banner', label: 'Debajo del encabezado' },
  { id: 'news_between', label: 'Entre secciones de noticias' },
  { id: 'news_sidebar', label: 'Barra lateral de noticias' },
  { id: 'article_inline', label: 'Dentro de noticia' },
  { id: 'article_footer', label: 'Final de noticia' },
] as const
export type AdPlacement = (typeof AD_PLACEMENTS)[number]['id']
export type AdStatus = AdvertisementRow['status']
export type AdInput = Pick<AdvertisementRow, 'title' | 'advertiser_name' | 'image_url' | 'target_url' | 'placement' | 'start_date' | 'end_date' | 'priority' | 'status'>
const adFields = 'id,title,advertiser_name,image_url,target_url,placement,start_date,end_date,is_active,priority,status,created_at,updated_at'

function currentStatus(ad: AdvertisementRow): AdStatus {
  if (ad.status === 'draft' || ad.status === 'paused' || ad.status === 'finished') return ad.status
  const today = new Date().toISOString().slice(0, 10)
  if (ad.end_date < today) return 'finished'
  if (ad.start_date > today) return 'scheduled'
  return 'active'
}

function checkedHttpsUrl(value: string, label: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:') throw new Error(`${label} debe usar HTTPS.`)
  return url.toString()
}

export async function fetchActiveAd(placement: AdPlacement): Promise<AdvertisementRow | null> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await getSupabaseClient().from('advertisements').select(adFields)
    .eq('placement', placement).eq('is_active', true).in('status', ['active', 'scheduled'])
    .lte('start_date', today).gte('end_date', today).order('priority', { ascending: false }).limit(1).maybeSingle()
    .overrideTypes<AdvertisementRow | null, { merge: false }>()
  if (error) throw new Error('No se pudo cargar el espacio publicitario.')
  return data
}

export async function fetchAdminAds(): Promise<AdvertisementRow[]> {
  const { data, error } = await getSupabaseClient().from('advertisements').select(adFields).order('priority', { ascending: false }).order('created_at', { ascending: false })
    .overrideTypes<AdvertisementRow[], { merge: false }>()
  if (error) throw new Error('No se pudieron cargar los anuncios.')
  return (data ?? []).map((ad) => ({ ...ad, status: currentStatus(ad) }))
}

export async function saveAd(input: AdInput, id?: string): Promise<void> {
  const imageUrl = checkedHttpsUrl(input.image_url.trim(), 'La imagen')
  const targetUrl = checkedHttpsUrl(input.target_url.trim(), 'El destino')
  if (!AD_PLACEMENTS.some((item) => item.id === input.placement)) throw new Error('Selecciona una ubicación válida.')
  if (input.end_date < input.start_date) throw new Error('La fecha final debe ser igual o posterior a la inicial.')
  const today = new Date().toISOString().slice(0, 10)
  const status: AdStatus = input.status !== 'draft' && input.status !== 'paused' && input.end_date < today ? 'finished'
    : input.status === 'active' && input.start_date > today ? 'scheduled' : input.status
  const isActive = status === 'active' || status === 'scheduled'
  const values = { ...input, image_url: imageUrl, target_url: targetUrl, is_active: isActive, status }
  const result = id ? await getSupabaseClient().from('advertisements').update(values).eq('id', id)
    : await getSupabaseClient().from('advertisements').insert(values)
  if (result.error) throw new Error('No se pudo guardar el anuncio.')
}

export async function deleteAd(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('advertisements').delete().eq('id', id)
  if (error) throw new Error('No se pudo eliminar el anuncio.')
}

export async function setAdStatus(ad: AdvertisementRow, status: AdStatus): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const normalized = status === 'active' && ad.end_date < today ? 'finished'
    : status === 'active' && ad.start_date > today ? 'scheduled' : status
  const { error } = await getSupabaseClient().from('advertisements').update({ status: normalized, is_active: normalized === 'active' || normalized === 'scheduled' }).eq('id', ad.id)
  if (error) throw new Error('No se pudo cambiar el estado del anuncio.')
}

export async function recordAdEvent(event: 'ad_impression' | 'ad_click', adId: string, path: string): Promise<void> {
  const token = getVisitorToken()
  await getSupabaseClient().rpc('record_public_analytics_event', { event_name: event, event_path: path.slice(0, 500), visitor_token: token, target_advertisement_id: adId })
}

export function getVisitorToken(): string {
  const key = 'pm_visitor_token'
  try {
    let token = localStorage.getItem(key)
    if (!token) { token = crypto.randomUUID(); localStorage.setItem(key, token) }
    return token
  } catch { return crypto.randomUUID() }
}
