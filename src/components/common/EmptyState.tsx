import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  eyebrow?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  eyebrow,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border border-rule bg-paper-strong px-6 py-12 text-center shadow-editorial sm:px-10 sm:py-16',
        className,
      )}
    >
      {Icon && (
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rule bg-paper text-ink-muted">
          <Icon aria-hidden="true" size={22} strokeWidth={1.6} />
        </span>
      )}

      {eyebrow && (
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
          {eyebrow}
        </p>
      )}

      <h3 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">{description}</p>

      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </div>
  )
}
