import { Link } from 'react-router-dom'

import { paths } from '@/routes/paths'
import { cn } from '@/utils/cn'

interface LogoProps {
  className?: string
  inverted?: boolean
  compact?: boolean
  onNavigate?: () => void
}

/**
 * Provisional wordmark. It will be replaced by the official logo
 * once the brand assets are delivered.
 */
export function Logo({ className, inverted = false, compact = false, onNavigate }: LogoProps) {
  return (
    <Link
      to={paths.home}
      onClick={onNavigate}
      aria-label="Prensa Metapán — Ir al inicio"
      className={cn('group inline-flex flex-col items-start gap-1.5', className)}
    >
      <span
        className={cn(
          'font-serif text-[1.7rem] font-semibold leading-none tracking-[-0.035em] sm:text-[2.1rem]',
          inverted ? 'text-paper' : 'text-ink',
        )}
      >
        Prensa{' '}
        <span className={inverted ? 'text-brand-light' : 'text-brand'}>Metapán</span>
      </span>

      {!compact && (
        <span
          className={cn(
            'flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.24em] sm:text-[9px]',
            inverted ? 'text-white/50' : 'text-ink-muted',
          )}
        >
          <span className="h-px w-4 bg-current" aria-hidden="true" />
          Periodismo local · El Salvador
        </span>
      )}
    </Link>
  )
}
