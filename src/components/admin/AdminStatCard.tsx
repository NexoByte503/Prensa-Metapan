import type { LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'

interface AdminStatCardProps {
  readonly label: string
  readonly value: string | number
  readonly icon: LucideIcon
  readonly hint?: string
  readonly tone?: 'default' | 'brand' | 'muted'
  readonly className?: string
}

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
  className,
}: AdminStatCardProps) {
  const toneClassNames = {
    default: 'border-rule bg-paper-strong',
    brand: 'border-brand/25 bg-brand-soft/60',
    muted: 'border-rule bg-paper',
  } as const

  const valueClassNames = {
    default: 'text-ink',
    brand: 'text-brand-dark',
    muted: 'text-ink-muted',
  } as const

  return (
    <article
      className={cn(
        'flex items-start justify-between gap-4 border p-5 shadow-editorial',
        toneClassNames[tone],
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
          {label}
        </p>
        <p
          className={cn(
            'mt-2 font-serif text-3xl font-semibold leading-none tracking-[-0.03em]',
            valueClassNames[tone],
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-ink-muted">{hint}</p>}
      </div>

      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rule bg-paper text-ink-muted">
        <Icon aria-hidden="true" size={18} strokeWidth={1.6} className="text-brand" />
      </span>
    </article>
  )
}
