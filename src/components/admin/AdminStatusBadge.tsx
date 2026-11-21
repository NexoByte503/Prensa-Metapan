import type { ArticleStatus } from '@/types'
import { Archive, CheckCircle2, Clock, FileEdit } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const statusConfig: Record<ArticleStatus, { label: string; icon: LucideIcon; className: string }> = {
  draft: {
    label: 'Borrador',
    icon: FileEdit,
    className: 'border-rule bg-paper text-ink-muted',
  },
  review: {
    label: 'En revisión',
    icon: Clock,
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  published: {
    label: 'Publicada',
    icon: CheckCircle2,
    className: 'border-brand/25 bg-brand-soft/60 text-brand-dark',
  },
  archived: {
    label: 'Archivada',
    icon: Archive,
    className: 'border-rule bg-paper text-ink-muted',
  },
}

export function AdminStatusBadge({ status }: { status: ArticleStatus }) {
  const config = statusConfig[status]

  if (!config) {
    return null
  }

  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${config.className}`}
    >
      <Icon aria-hidden="true" size={11} strokeWidth={2} />
      {config.label}
    </span>
  )
}
