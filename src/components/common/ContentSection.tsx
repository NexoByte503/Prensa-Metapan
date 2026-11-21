import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

interface ContentSectionProps {
  title: string
  id?: string
  children: ReactNode
  className?: string
}

export function ContentSection({ title, id, children, className }: ContentSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-24 border-t border-rule pt-5', className)}>
      <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-ink-muted sm:text-[15px]">
        {children}
      </div>
    </section>
  )
}
