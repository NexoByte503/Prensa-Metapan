import type { ReactNode } from 'react'

interface AuthCardProps {
  kicker: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ kicker, title, description, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="border border-rule bg-paper-strong p-6 shadow-editorial sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
          {kicker}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{description}</p>

        <div className="mt-7">{children}</div>
      </div>

      {footer && <div className="mt-5 text-center text-xs text-ink-muted">{footer}</div>}
    </div>
  )
}
