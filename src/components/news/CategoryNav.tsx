import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { categories } from '@/config/categories'
import { paths } from '@/routes/paths'
import type { CategorySlug } from '@/types'
import { fetchCategories } from '@/services/content/categories'
import { cn } from '@/utils/cn'

interface CategoryNavProps {
  activeSlug?: CategorySlug | string
  showAll?: boolean
  className?: string
}

export function CategoryNav({ activeSlug, showAll = true, className }: CategoryNavProps) {
  const [items, setItems] = useState<readonly { slug: string; name: string }[]>(categories)

  useEffect(() => {
    let active = true
    fetchCategories().then((result) => {
      if (active && result.length) setItems(result.map(({ slug, name }) => ({ slug, name })))
    }).catch(() => { /* La navegación fija sigue disponible si Supabase no está configurado. */ })
    return () => { active = false }
  }, [])

  const baseClassName =
    'inline-flex shrink-0 items-center border px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors'
  const activeClassName = 'border-ink bg-ink text-paper'
  const inactiveClassName =
    'border-rule bg-paper-strong text-ink-muted hover:border-ink hover:text-ink'

  return (
    <nav
      aria-label="Secciones de noticias"
      className={cn(
        'flex w-full max-w-full gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {showAll && (
        <Link
          to={paths.news}
          aria-current={activeSlug ? undefined : 'page'}
          className={cn(baseClassName, activeSlug ? inactiveClassName : activeClassName)}
        >
          Todas
        </Link>
      )}

      {items.map((category) => (
        <Link
          key={category.slug}
          to={paths.category(category.slug)}
          aria-current={activeSlug === category.slug ? 'page' : undefined}
          className={cn(
            baseClassName,
            activeSlug === category.slug ? activeClassName : inactiveClassName,
          )}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  )
}
