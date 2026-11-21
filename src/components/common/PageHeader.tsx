import type { ReactNode } from 'react'

import { Breadcrumbs, type BreadcrumbItem } from '@/components/common/Breadcrumbs'
import { Container } from '@/components/common/Container'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  kicker: string
  title: string
  description?: string
  breadcrumbs: readonly BreadcrumbItem[]
  children?: ReactNode
  aside?: ReactNode
  className?: string
}

export function PageHeader({
  kicker,
  title,
  description,
  breadcrumbs,
  children,
  aside,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn('border-b border-rule bg-paper-strong', className)}>
      <Container className="py-8 lg:py-12">
        <Breadcrumbs items={breadcrumbs} />

        <div
          className={cn(
            'mt-7',
            aside
              ? 'flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:gap-12'
              : 'max-w-3xl',
          )}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
              {kicker}
            </p>
            <h1 className="mt-3 font-serif text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3.4rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
            {children}
          </div>

          {aside && <div>{aside}</div>}
        </div>
      </Container>
    </section>
  )
}
