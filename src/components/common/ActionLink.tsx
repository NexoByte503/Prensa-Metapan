import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/utils/cn'

type ActionLinkVariant = 'primary' | 'secondary' | 'inverse'

interface ActionLinkProps {
  to: string
  children: ReactNode
  variant?: ActionLinkVariant
  icon?: LucideIcon
  className?: string
}

const variantClassNames: Record<ActionLinkVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border border-rule-strong bg-paper-strong text-ink hover:border-ink hover:bg-paper',
  inverse: 'bg-paper text-ink hover:bg-white',
}

export function ActionLink({
  to,
  children,
  variant = 'primary',
  icon: Icon,
  className,
}: ActionLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex items-center justify-center gap-2 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors',
        variantClassNames[variant],
        className,
      )}
    >
      {children}
      {Icon && (
        <Icon
          aria-hidden="true"
          size={15}
          strokeWidth={1.8}
          className="transition-transform group-hover:translate-x-0.5"
        />
      )}
    </Link>
  )
}
