import { getSupabaseClient } from '@/services/supabase'

import { AnalyticsServiceError } from './errors'

export interface ArticleViewsByArticle {
  readonly articleId: string
  readonly title: string
  readonly slug: string
  readonly views: number
}

export interface ArticleViewsStats {
  readonly totalViews: number
  readonly viewsByArticle: readonly ArticleViewsByArticle[]
}

interface ArticleViewsQueryRow {
  readonly id: string
  readonly title: string
  readonly slug: string
  readonly views_count: number | null
}

export async function fetchTotalArticleViews(): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from('article_views')
    .select('id', { count: 'exact', head: true })

  if (error) {
    throw new AnalyticsServiceError('No se pudieron contar las visitas registradas.')
  }

  return count ?? 0
}

export async function fetchArticleViewsStats(): Promise<ArticleViewsStats> {
  const [{ count: totalViews, error: totalError }, articlesResponse] = await Promise.all([
    getSupabaseClient().from('article_views').select('id', { count: 'exact', head: true }),
    getSupabaseClient()
      .from('articles')
      .select('id, title, slug, views_count')
      .overrideTypes<ArticleViewsQueryRow[], { merge: false }>(),
  ])

  if (totalError) {
    throw new AnalyticsServiceError('No se pudieron contar las visitas registradas.')
  }

  const viewsByArticle = (articlesResponse.data ?? [])
    .map((article) => ({
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      views: Number(article.views_count ?? 0),
    }))
    .filter((entry) => entry.views > 0)
    .sort((a, b) => b.views - a.views)

  return {
    totalViews: totalViews ?? 0,
    viewsByArticle,
  }
}
