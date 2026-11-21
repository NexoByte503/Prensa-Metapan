import { getSupabaseClient } from '@/services/supabase'
import type { ArticleStatus } from '@/types'
import { AnalyticsServiceError } from './errors'

export interface DashboardArticle {
  readonly id: string
  readonly title: string
  readonly slug: string
  readonly featured_image: string | null
  readonly status: ArticleStatus
  readonly created_at: string
  readonly published_at: string | null
  readonly category: { readonly name: string } | null
  readonly author: { readonly full_name: string } | null
}

export interface DashboardData {
  readonly total: number
  readonly published: number
  readonly drafts: number
  readonly review: number
  readonly pendingComments: number | null
  readonly visits: number | null
  readonly recentArticles: readonly DashboardArticle[]
  readonly articlesByDay: readonly { label: string; value: number }[]
  readonly publishedByDay: readonly { label: string; value: number }[]
  readonly mostViewed: readonly { label: string; value: number }[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const client = getSupabaseClient()
  const since = new Date()
  since.setDate(since.getDate() - 6)
  since.setHours(0, 0, 0, 0)
  const dayRows = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(since)
    date.setDate(since.getDate() + index)
    return { date, label: date.toLocaleDateString('es-SV', { weekday: 'short' }).replace('.', ''), value: 0 }
  })
  const publishedRows = dayRows.map((day) => ({ ...day, value: 0 }))

  const [total, published, drafts, review, pending, visits, recent, created, publishedDays, topViewed] = await Promise.all([
    client.from('articles').select('id', { count: 'exact', head: true }),
    client.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published').lte('published_at', new Date().toISOString()),
    client.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    client.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'review'),
    client.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    client.from('article_views').select('id', { count: 'exact', head: true }),
    client.from('articles').select('id,title,slug,featured_image,status,created_at,published_at,category:categories(name),author:profiles(full_name)').order('updated_at', { ascending: false }).limit(6)
      .overrideTypes<DashboardArticle[], { merge: false }>(),
    client.from('articles').select('created_at').gte('created_at', since.toISOString()).order('created_at', { ascending: true })
      .overrideTypes<Array<{ created_at: string }>, { merge: false }>(),
    client.from('articles').select('published_at').eq('status', 'published').gte('published_at', since.toISOString())
      .overrideTypes<Array<{ published_at: string | null }>, { merge: false }>(),
    client.from('articles').select('title,views_count').eq('status', 'published').lte('published_at', new Date().toISOString()).gt('views_count', 0).order('views_count', { ascending: false }).limit(5)
      .overrideTypes<Array<{ title: string; views_count: number }>, { merge: false }>(),
  ])

  if ([total, published, drafts, review, recent, created, publishedDays, topViewed].some((result) => result.error)) {
    throw new AnalyticsServiceError('No se pudieron cargar las métricas del panel.')
  }

  for (const row of created.data ?? []) {
    const rowDate = new Date(row.created_at)
    const day = dayRows.find(({ date }) => date.toDateString() === rowDate.toDateString())
    if (day) day.value += 1
  }
  for (const row of publishedDays.data ?? []) {
    if (!row.published_at) continue
    const rowDate = new Date(row.published_at)
    const day = publishedRows.find(({ date }) => date.toDateString() === rowDate.toDateString())
    if (day) day.value += 1
  }

  return {
    total: total.count ?? 0,
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
    review: review.count ?? 0,
    pendingComments: pending.error ? null : pending.count ?? 0,
    visits: visits.error ? null : visits.count ?? 0,
    recentArticles: recent.data ?? [],
    articlesByDay: dayRows.map(({ label, value }) => ({ label, value })),
    publishedByDay: publishedRows.map(({ label, value }) => ({ label, value })),
    mostViewed: (topViewed.data ?? []).map((article) => ({ label: article.title, value: article.views_count })),
  }
}
