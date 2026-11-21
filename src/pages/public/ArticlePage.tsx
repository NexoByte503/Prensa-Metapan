import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, CalendarDays, Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { ActionLink } from '@/components/common/ActionLink'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { Container } from '@/components/common/Container'
import { PageLoading } from '@/components/common/PageLoading'
import { Seo } from '@/components/seo/Seo'
import { StructuredData } from '@/components/seo/Seo'
import { siteConfig } from '@/config/site'
import { paths } from '@/routes/paths'
import { fetchPublishedArticleBySlug, fetchRelatedPublishedArticles, type PublishedArticleDetail, type PublishedArticleSummary } from '@/services/content/articles'
import { fetchPublishedComments, submitPublicComment, type PublicComment } from '@/services/content/comments'
import { ArticleCard } from '@/components/news/ArticleCard'
import { sanitizeHtml } from '@/utils/sanitize'
import { formatShortDate } from '@/utils/date'
import { AdSlot } from '@/components/ads/AdSlot'
import { recordPageView } from '@/services/analytics'

export default function ArticlePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<PublishedArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<PublicComment[]>([])
  const [related, setRelated] = useState<PublishedArticleSummary[]>([])
  const [authorName, setAuthorName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)
  const [commentNotice, setCommentNotice] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setArticle(null)
    setComments([])
    setRelated([])
    setError(null)
    fetchPublishedArticleBySlug(slug).then((result) => { if (active) { setArticle(result); if (result) { void fetchPublishedComments(result.id).then(setComments).catch(() => setComments([])); void fetchRelatedPublishedArticles(result.id, result.category?.id ?? null).then(setRelated).catch(() => setRelated([])) } } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la noticia.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  const safeContent = useMemo(() => article ? sanitizeHtml(article.content) : '', [article])
  useEffect(() => { if (article) void recordPageView(paths.article(article.slug), article.id).catch(() => {}) }, [article])

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!article || sending) return
    setSending(true); setCommentNotice('')
    try { await submitPublicComment(article.id, authorName, commentText); setAuthorName(''); setCommentText(''); setCommentNotice('Comentario enviado. Aparecerá cuando la redacción lo apruebe.') }
    catch (cause) { setCommentNotice(cause instanceof Error ? cause.message : 'No se pudo enviar el comentario.') }
    finally { setSending(false) }
  }

  return <>
    <Seo title={article?.seoTitle || article?.title || 'Noticia'} description={article?.seoDescription || article?.excerpt || article?.subtitle || undefined} path={paths.article(slug)} type="article" image={article?.ogImage || article?.featuredImage} />
    {article ? <>
      <StructuredData data={{ '@context': 'https://schema.org', '@type': 'NewsArticle', headline: article.title, description: article.seoDescription || article.excerpt || article.subtitle || undefined, image: article.ogImage || article.featuredImage ? [new URL(article.ogImage || article.featuredImage!, siteConfig.url ?? window.location.origin).toString()] : undefined, datePublished: article.publishedAt, dateModified: article.updatedAt, publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url ?? window.location.origin }, mainEntityOfPage: { '@type': 'WebPage', '@id': new URL(paths.article(article.slug), siteConfig.url ?? window.location.origin).toString() } }} />
      <StructuredData data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: new URL(paths.home, siteConfig.url ?? window.location.origin).toString() }, { '@type': 'ListItem', position: 2, name: 'Noticias', item: new URL(paths.news, siteConfig.url ?? window.location.origin).toString() }, ...(article.category ? [{ '@type': 'ListItem', position: 3, name: article.category.name, item: new URL(paths.category(article.category.slug), siteConfig.url ?? window.location.origin).toString() }] : []), { '@type': 'ListItem', position: article.category ? 4 : 3, name: article.title, item: new URL(paths.article(article.slug), siteConfig.url ?? window.location.origin).toString() }] }} />
    </> : null}
    {loading ? <Container className="py-20"><PageLoading /></Container> : error ? <Container className="py-16"><div role="alert" className="mx-auto max-w-3xl border border-brand/30 bg-brand-soft/70 p-5 text-sm">{error}<div className="mt-5"><ActionLink to={paths.news} icon={ArrowLeft} variant="secondary">Volver a noticias</ActionLink></div></div></Container> : !article ? <Container className="py-16"><div className="mx-auto max-w-3xl"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">Archivo editorial</p><h1 className="mt-3 font-serif text-4xl font-semibold">Esta noticia no está publicada</h1><p className="mt-3 text-sm text-ink-muted">El enlace puede ser incorrecto o la noticia aún no está disponible.</p><div className="mt-6"><ActionLink to={paths.news} icon={ArrowLeft} variant="secondary">Volver a noticias</ActionLink></div></div></Container> : <>
      <section className="border-b border-rule bg-paper-strong"><Container className="py-8 lg:py-12"><Breadcrumbs items={[{ label: 'Inicio', to: paths.home }, { label: 'Noticias', to: paths.news }, { label: article.category?.name ?? 'Noticia' }]} />
        <article className="mx-auto mt-10 max-w-4xl"><div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">{article.category ? <Link to={paths.category(article.category.slug)} className="text-brand">{article.category.name}</Link> : null}<time className="inline-flex items-center gap-1.5" dateTime={article.publishedAt}><CalendarDays size={13} />{formatShortDate(article.publishedAt)}</time>{article.isBreaking ? <span className="bg-brand px-2 py-1 text-white">Última hora</span> : null}</div>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-6xl">{article.title}</h1>
          {article.subtitle ? <p className="mt-4 text-xl leading-relaxed text-ink-muted">{article.subtitle}</p> : null}
          {article.excerpt ? <p className="mt-5 border-l-2 border-brand pl-4 text-base leading-relaxed text-ink-muted">{article.excerpt}</p> : null}
          {article.featuredImage ? <img src={article.featuredImage} alt={article.featuredImageAlt || article.title} fetchPriority="high" decoding="async" className="mt-8 max-h-[36rem] w-full object-cover" /> : null}
          <div className="prose mt-9 max-w-none" dangerouslySetInnerHTML={{ __html: safeContent }} />
          <div className="mt-10"><AdSlot placement="article_inline" /></div>
        </article>
      </Container></section>
      <Container className="py-8">
        <AdSlot placement="article_footer" />
        <Link to={paths.news} className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted hover:text-brand"><ArrowLeft size={14} /> Todas las noticias</Link>
        <section className="mx-auto mt-10 max-w-4xl border-t border-rule pt-8" aria-labelledby="comments-title">
          <h2 id="comments-title" className="font-serif text-2xl font-semibold">Comentarios</h2>
          <form onSubmit={handleCommentSubmit} className="mt-5 grid gap-3">
            <label className="grid gap-1 text-xs font-medium">Tu nombre<input required minLength={2} maxLength={100} value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="border border-rule-strong bg-paper p-3" /></label>
            <label className="grid gap-1 text-xs font-medium">Comentario<textarea required minLength={2} maxLength={2000} rows={4} value={commentText} onChange={(e) => setCommentText(e.target.value)} className="border border-rule-strong bg-paper p-3" /></label>
            <button disabled={sending} className="inline-flex w-fit items-center gap-2 bg-brand px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"><Send size={14} />{sending ? 'Enviando…' : 'Enviar comentario'}</button>
            {commentNotice ? <p role="status" className="text-sm text-ink-muted">{commentNotice}</p> : null}
            <p className="text-xs text-ink-muted">Los comentarios se revisan antes de publicarse.</p>
          </form>
          <ul className="mt-8 divide-y divide-rule">{comments.map((comment) => <li key={comment.id} className="py-4"><p className="text-sm font-semibold">{comment.authorName}<time className="ml-3 text-xs font-normal text-ink-muted">{formatShortDate(comment.createdAt)}</time></p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p></li>)}</ul>
          {!comments.length ? <p className="mt-5 text-sm text-ink-muted">Todavía no hay comentarios publicados.</p> : null}
        </section>
        {related.length ? <section className="mx-auto mt-12 max-w-6xl border-t border-rule pt-8"><h2 className="font-serif text-2xl font-semibold">Noticias relacionadas</h2><div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <ArticleCard key={item.id} article={item} />)}</div></section> : null}
      </Container>
    </>}
  </>
}
