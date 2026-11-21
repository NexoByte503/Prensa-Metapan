import { useEffect, useState } from 'react'
import { Newspaper } from 'lucide-react'

import { ArticleCard } from '@/components/news/ArticleCard'
import { CategoryNav } from '@/components/news/CategoryNav'
import { Container } from '@/components/common/Container'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoading } from '@/components/common/PageLoading'
import { NewsSidebar } from '@/components/news/NewsSidebar'
import { Seo } from '@/components/seo/Seo'
import { BreadcrumbStructuredData } from '@/components/seo/Seo'
import { siteConfig } from '@/config/site'
import { paths } from '@/routes/paths'
import { fetchPublishedArticles, type PublishedArticleSummary } from '@/services/content/articles'
import { AdSlot } from '@/components/ads/AdSlot'

const PAGE_SIZE = 12

export default function NewsPage() {
  const [articles, setArticles] = useState<PublishedArticleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState(false)

  useEffect(() => {
    let active = true
    fetchPublishedArticles({ limit: PAGE_SIZE }).then((result) => {
      if (active) { setArticles(result); setHasMore(result.length === PAGE_SIZE) }
    }).catch((cause: unknown) => {
      console.error('[Prensa Metapán] No se pudo cargar el archivo de noticias:', cause)
      if (active) setError('No se pudieron cargar las noticias. Inténtalo de nuevo más tarde.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    setLoadMoreError(false)
    try {
      const result = await fetchPublishedArticles({ limit: PAGE_SIZE, offset: articles.length })
      setArticles((current) => [...current, ...result])
      setHasMore(result.length === PAGE_SIZE)
    } catch (cause) {
      console.error('[Prensa Metapán] No se pudieron cargar más noticias:', cause)
      setLoadMoreError(true)
    }
    finally { setLoadingMore(false) }
  }

  return <>
    <Seo title="Noticias" description="Noticias de Metapán, Santa Ana y El Salvador. Cobertura local con contexto y verificación." path={paths.news} />
    <BreadcrumbStructuredData items={[{ name: 'Inicio', url: new URL(paths.home, siteConfig.url ?? window.location.origin).toString() }, { name: 'Noticias', url: new URL(paths.news, siteConfig.url ?? window.location.origin).toString() }]} />
    <PageHeader kicker="Archivo" title="Noticias" description="Cobertura de Metapán, Santa Ana y El Salvador, organizada para encontrar cada tema con claridad." breadcrumbs={[{ label: 'Inicio', to: paths.home }, { label: 'Noticias' }]} aside={<div className="border-l-2 border-brand pl-4"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Estado del archivo</p><p className="mt-2 font-serif text-lg font-semibold leading-tight">{loading ? 'Consultando noticias' : error ? 'Noticias no disponibles' : articles.length ? 'Noticias publicadas' : 'Sin noticias publicadas'}</p><p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{loading ? 'Consultando el archivo…' : error ? 'Inténtalo de nuevo más tarde.' : `${articles.length} publicaciones visibles`}</p></div>}>
      <CategoryNav className="mt-8" />
    </PageHeader>
    <section><Container className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14 lg:py-16">
      <div><div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3"><h2 className="font-serif text-2xl font-semibold tracking-[-0.02em]">Últimas publicaciones</h2><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{articles.length} noticias</p></div>
        {loading ? <div className="mt-8"><PageLoading /></div> : error ? <div role="alert" className="mt-8 border border-brand/30 bg-brand-soft/70 p-4 text-sm">{error}</div> : articles.length ? <><div className="mt-7 grid gap-x-6 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">{articles.map((article) => <ArticleCard key={article.id} article={article} />)}</div><div className="mt-10"><AdSlot placement="news_between" /></div>{hasMore ? <><button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="mt-8 border border-rule-strong px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] disabled:opacity-50">{loadingMore ? 'Cargando…' : 'Cargar más'}</button>{loadMoreError ? <p role="alert" className="mt-3 text-sm text-ink-muted">No se pudieron cargar más noticias. Inténtalo de nuevo.</p> : null}</> : null}</> : <EmptyState className="mt-8" icon={Newspaper} eyebrow="Archivo vacío" title="Todavía no hay noticias publicadas" description="Cuando haya noticias publicadas, aparecerán aquí. Los canales de contacto están disponibles en la página de contacto." />}
      </div><NewsSidebar />
    </Container></section>
  </>
}
