import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthAlertTone = 'error' | 'success' | 'info'

interface AuthAlertProps {
  tone: AuthAlertTone
  children: ReactNode
}

const toneClassNames: Record<AuthAlertTone, string> = {
  error: 'border-brand/30 bg-brand-soft/70 text-ink',
  success: 'border-brand/25 bg-brand-soft/60 text-ink',
  info: 'border-rule bg-paper text-ink-muted',
}

const toneIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
} as const

export function AuthAlert({ tone, children }: AuthAlertProps) {
  const Icon = toneIcons[tone]

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 border p-3.5 text-xs leading-relaxed ${toneClassNames[tone]}`}
    >
      <Icon
        aria-hidden="true"
        size={16}
        strokeWidth={1.7}
        className="mt-0.5 shrink-0 text-brand"
      />
      <div>{children}</div>
    </div>
  )
}
