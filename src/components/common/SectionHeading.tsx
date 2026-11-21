import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

interface SectionHeadingProps {
  title: string
  titleId?: string
  kicker?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SectionHeading({
  title,
  titleId,
  kicker,
  description,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 border-t-2 border-ink pt-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div>
        {kicker && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
            {kicker}
          </p>
        )}
        <h2
          id={titleId}
          className="mt-2 font-serif text-3xl font-semibold tracking-[-0.025em] sm:text-4xl"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
