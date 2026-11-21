import { MapPin, RefreshCcw, Scale, SearchCheck, type LucideIcon } from 'lucide-react'

import { editorialPrinciples, type EditorialPrinciple } from '@/config/editorial'
import { cn } from '@/utils/cn'

interface NewsroomPrinciplesProps {
  limit?: number
  tone?: 'light' | 'dark'
  className?: string
}

const principleIcons: Record<EditorialPrinciple['key'], LucideIcon> = {
  verification: SearchCheck,
  context: MapPin,
  corrections: RefreshCcw,
  independence: Scale,
}

export function NewsroomPrinciples({
  limit = editorialPrinciples.length,
  tone = 'light',
  className,
}: NewsroomPrinciplesProps) {
  const isDark = tone === 'dark'

  return (
    <div className={cn('grid gap-x-8 gap-y-7 sm:grid-cols-2', className)}>
      {editorialPrinciples.slice(0, limit).map((principle, index) => {
        const Icon = principleIcons[principle.key]

        return (
          <article
            key={principle.key}
            className={cn('border-t pt-4', isDark ? 'border-night-rule' : 'border-rule')}
          >
            <div className="flex items-center justify-between gap-4">
              <Icon
                aria-hidden="true"
                size={20}
                strokeWidth={1.6}
                className={isDark ? 'text-brand-light' : 'text-brand'}
              />
              <span
                className={cn(
                  'font-serif text-sm tabular-nums',
                  isDark ? 'text-white/35' : 'text-rule-strong',
                )}
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h3
              className={cn(
                'mt-4 font-serif text-xl font-semibold tracking-[-0.015em]',
                isDark ? 'text-paper' : 'text-ink',
              )}
            >
              {principle.title}
            </h3>
            <p
              className={cn(
                'mt-2 text-sm leading-relaxed',
                isDark ? 'text-white/60' : 'text-ink-muted',
              )}
            >
              {principle.description}
            </p>
          </article>
        )
      })}
    </div>
  )
}
