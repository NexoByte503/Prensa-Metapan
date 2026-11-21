import { useEffect, useState } from 'react'
import { Newspaper } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { ArticleCard } from '@/components/news/ArticleCard'
import { ActionLink } from '@/components/common/ActionLink'
import { EmptyState } from '@/components/common/EmptyState'
import { Container } from '@/components/common/Container'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoading } from '@/components/common/PageLoading'
import { CategoryNav } from '@/components/news/CategoryNav'
import { NewsSidebar } from '@/components/news/NewsSidebar'
import { Seo } from '@/components/seo/Seo'
import { BreadcrumbStructuredData } from '@/components/seo/Seo'
import { siteConfig } from '@/config/site'
import { getCategoryBySlug } from '@/config/categories'
import NotFoundPage from '@/pages/NotFoundPage'
import { paths } from '@/routes/paths'
import { fetchPublishedArticlesByCategory, type PublishedArticleSummary } from '@/services/content/articles'
import { fetchCategoryBySlug } from '@/services/content/categories'
import type { CategoryRow } from '@/types'

export default function CategoryPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [dbCategory, setDbCategory] = useState<CategoryRow | null>(null)
  const [categoryLookupDone, setCategoryLookupDone] = useState(false)
  const category = dbCategory ?? getCategoryBySlug(slug)
  const [articles, setArticles] = useState<PublishedArticleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setCategoryLookupDone(false)
    fetchCategoryBySlug(slug).then((result) => { if (active) setDbCategory(result) }).catch(() => { if (active) setDbCategory(null) }).finally(() => { if (active) setCategoryLookupDone(true) })
    fetchPublishedArticlesByCategory(slug, { limit: 50 }).then((result) => { if (active) setArticles(result) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la sección.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  if (!category && !categoryLookupDone) return <Container className="py-20"><PageLoading /></Container>
  if (!category) return <NotFoundPage />
  return <>
    <Seo title={category.name} description={category.description ?? ''} path={paths.category(category.slug)} />
    <BreadcrumbStructuredData items={[{ name: 'Inicio', url: new URL(paths.home, siteConfig.url ?? window.location.origin).toString() }, { name: 'Noticias', url: new URL(paths.news, siteConfig.url ?? window.location.origin).toString() }, { name: category.name, url: new URL(paths.category(category.slug), siteConfig.url ?? window.location.origin).toString() }]} />
    <PageHeader kicker="Sección" title={category.name} description={category.description ?? ''} breadcrumbs={[{ label: 'Inicio', to: paths.home }, { label: 'Secciones', to: paths.news }, { label: category.name }]} aside={<div className="border-l-2 border-brand pl-4"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Cobertura</p><p className="mt-2 font-serif text-lg font-semibold leading-tight">{loading ? 'Consultando noticias' : error ? 'Noticias no disponibles' : articles.length ? 'Cobertura publicada' : 'Sin noticias publicadas'}</p><p className="mt-1.5 text-xs text-ink-muted">{articles.length} publicaciones</p></div>}><CategoryNav activeSlug={category.slug} className="mt-8" /></PageHeader>
    <section><Container className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14 lg:py-16"><div>
      <div className="flex items-center justify-between gap-3 border-b border-rule pb-3"><h2 className="font-serif text-2xl font-semibold">Publicaciones de {category.name}</h2><p className="text-[9px] uppercase tracking-[0.16em] text-ink-muted">{articles.length} notas</p></div>
      {loading ? <div className="mt-8"><PageLoading /></div> : error ? <div role="alert" className="mt-8 border border-brand/30 bg-brand-soft/70 p-4 text-sm">No se pudieron cargar las noticias de esta sección. Inténtalo de nuevo más tarde.</div> : articles.length ? <div className="mt-7 grid gap-x-6 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">{articles.map((article) => <ArticleCard key={article.id} article={article} />)}</div> : <EmptyState className="mt-8" icon={Newspaper} eyebrow="Sin publicaciones" title={`${category.name} todavía no tiene noticias`} description="Cuando haya noticias publicadas en esta sección, aparecerán aquí. Los canales de contacto están disponibles en la página de contacto." action={<ActionLink to={paths.news} variant="secondary">Ver todas las noticias</ActionLink>} />}
    </div><NewsSidebar /></Container></section>
  </>
}
