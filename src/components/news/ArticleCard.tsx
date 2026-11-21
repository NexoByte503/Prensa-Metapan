import { Link } from 'react-router-dom'

import { paths } from '@/routes/paths'
import type { PublishedArticleSummary } from '@/services/content/articles'
import { cn } from '@/utils/cn'
import { formatShortDate } from '@/utils/date'

interface ArticleCardProps {
  article: PublishedArticleSummary
  className?: string
}

export function ArticleCard({ article, className }: ArticleCardProps) {
  const publishedDate = formatShortDate(article.publishedAt)
  return (
    <article className={cn('group border-t border-rule pt-4', className)}>
      <div className="flex h-full flex-col">
        {article.featuredImage && <Link to={paths.article(article.slug)} className="mb-4 aspect-[16/9] overflow-hidden bg-ink/5"><img src={article.featuredImage} alt={article.featuredImageAlt || article.title} loading="lazy" decoding="async" sizes="(min-width:1280px) 25vw, (min-width:640px) 50vw, 100vw" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" /></Link>}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
          {article.category && <Link to={paths.category(article.category.slug)} className="text-brand hover:underline">{article.category.name}</Link>}
          {article.category && publishedDate && <span className="h-1 w-1 rounded-full bg-rule-strong" aria-hidden="true" />}
          {publishedDate && <time dateTime={article.publishedAt} className="text-ink-muted">{publishedDate}</time>}
        </div>
        <h3 className="mt-3 font-serif text-2xl font-semibold leading-[1.12] tracking-[-0.02em] transition-colors group-hover:text-brand"><Link to={paths.article(article.slug)}>{article.title}</Link></h3>
        {article.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">{article.excerpt}</p>}
        <div className="mt-auto flex items-center gap-2 pt-5 text-[11px] text-ink-muted"><span>{article.author?.fullName ?? 'Redacción'}</span>{article.isFeatured ? <span className="text-brand">Destacada</span> : null}</div>
      </div>
    </article>
  )
}
