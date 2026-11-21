import { getSupabaseClient } from '@/services/supabase'
import { getVisitorToken } from '@/services/advertisements'

const botPattern = /bot|crawler|spider|headless|lighthouse|facebookexternalhit|whatsapp/i

export async function recordPageView(path: string, articleId?: string): Promise<void> {
  if (typeof window === 'undefined' || navigator.webdriver || botPattern.test(navigator.userAgent)) return
  await getSupabaseClient().rpc('record_public_analytics_event', {
    event_name: 'page_view', event_path: path, visitor_token: getVisitorToken(), target_article_id: articleId ?? null,
  })
}

export interface SiteAnalytics {
  total: number
  today: number
  last7: number
  last30: number
  uniqueVisitors: number
  daily: Array<{ date: string; value: number }>
  topArticles: Array<{ id: string; title: string; slug: string; views: number }>
  topCategories: Array<{ name: string; views: number }>
  adStats: Array<{ id: string; title: string; placement: string; impressions: number; clicks: number; ctr: number }>
}

export async function fetchSiteAnalytics(days = 30): Promise<SiteAnalytics> {
  const { data, error } = await getSupabaseClient().rpc('get_admin_site_analytics', { day_count: days })
  if (error) throw new Error('No se pudieron cargar las estadísticas del sitio.')
  return data as unknown as SiteAnalytics
}

export async function fetchArticleAnalytics(articleId: string, days = 30): Promise<Array<{ date: string; value: number }>> {
  const start = new Date(); start.setDate(start.getDate() - Math.max(1, Math.min(days, 90)) + 1); start.setHours(0, 0, 0, 0)
  const { data, error } = await getSupabaseClient().from('analytics_events').select('created_at')
    .eq('event_type', 'page_view').eq('article_id', articleId).gte('created_at', start.toISOString())
    .overrideTypes<Array<{ created_at: string }>, { merge: false }>()
  if (error) throw new Error('No se pudo cargar la evolución de la noticia.')
  const byDay = new Map<string, number>()
  for (const row of data ?? []) { const date = row.created_at.slice(0, 10); byDay.set(date, (byDay.get(date) ?? 0) + 1) }
  return Array.from({ length: days }, (_, i) => { const date = new Date(start); date.setDate(start.getDate() + i); const key = date.toISOString().slice(0, 10); return { date: key, value: byDay.get(key) ?? 0 } })
}
