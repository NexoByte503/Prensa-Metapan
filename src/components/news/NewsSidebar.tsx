import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { categories } from '@/config/categories'
import { paths } from '@/routes/paths'
import { cn } from '@/utils/cn'
import { AdSlot } from '@/components/ads/AdSlot'

const publicationSteps = [
  'Contrastamos los datos relevantes con fuentes identificables.',
  'Explicamos el contexto local y el alcance de cada hecho.',
  'Corregimos de forma visible cuando cometemos un error.',
] as const

interface NewsSidebarProps {
  className?: string
}

export function NewsSidebar({ className }: NewsSidebarProps) {
  return (
    <aside className={cn('space-y-9', className)} aria-label="Información de la sección">
      <div className="border-t-2 border-ink pt-4">
        <h2 className="font-serif text-xl font-semibold tracking-[-0.02em]">Cómo publicamos</h2>
        <ol className="mt-4 space-y-4">
          {publicationSteps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden="true"
                className="font-serif text-sm tabular-nums text-rule-strong"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="text-xs leading-relaxed text-ink-muted">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="border border-rule bg-brand-soft/70 p-5">
        <ShieldCheck aria-hidden="true" size={20} strokeWidth={1.6} className="text-brand" />
        <h2 className="mt-3 font-serif text-lg font-semibold">Sin contenido de ejemplo</h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          No presentamos datos ficticios como noticias reales. El archivo se llenará únicamente con
          contenido editorial verificado.
        </p>
      </div>

      <div>
        <h2 className="font-serif text-xl font-semibold tracking-[-0.02em]">Explorar secciones</h2>
        <ul className="mt-3 divide-y divide-rule border-y border-rule">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                to={paths.category(category.slug)}
                className="group flex items-center justify-between gap-3 py-2.5 text-xs font-medium text-ink-muted transition-colors hover:text-brand"
              >
                {category.name}
                <ArrowUpRight
                  aria-hidden="true"
                  size={14}
                  strokeWidth={1.6}
                  className="text-rule-strong transition-colors group-hover:text-brand"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <AdSlot placement="news_sidebar" />
    </aside>
  )
}
