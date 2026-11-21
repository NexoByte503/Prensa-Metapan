import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ComponentPropsWithRef } from 'react'

import { cn } from '@/utils/cn'

interface PasswordFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'id' | 'type'> {
  label: string
  error?: string
  hint?: string
}

export function PasswordField({
  label,
  error,
  hint,
  className,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId()
  const inputId = `password-${generatedId}`
  const messageId = `${inputId}-message`
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div>
      <label
        htmlFor={inputId}
        className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
      >
        {label}
      </label>
      <div className="relative mt-2">
        <input
          {...props}
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            'h-12 w-full border bg-paper-strong px-3.5 pr-12 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none',
            error ? 'border-brand' : 'border-rule-strong',
            className,
          )}
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center text-ink-muted transition-colors hover:text-ink"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" size={17} strokeWidth={1.7} />
          ) : (
            <Eye aria-hidden="true" size={17} strokeWidth={1.7} />
          )}
        </button>
      </div>
      {error ? (
        <p id={messageId} role="alert" className="mt-2 text-xs text-brand">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-2 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
