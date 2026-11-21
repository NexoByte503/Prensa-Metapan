import { X } from 'lucide-react'
import { useRef, type ReactNode } from 'react'

import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'

interface AdminModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
  readonly footer?: ReactNode
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}: AdminModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)

  useLockBodyScroll(isOpen)
  useEscapeKey(onClose, isOpen)
  useFocusTrap(isOpen, panelRef)

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/60 p-0 sm:items-center sm:p-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto border border-night-rule bg-paper shadow-editorial"
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule bg-night p-5 text-paper sm:p-6">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-paper">
              {title}
            </h2>
            {description && <p className="mt-2 text-xs leading-relaxed text-paper/60">{description}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-night-rule text-paper/70 transition-colors hover:border-white/50 hover:text-paper"
          >
            <X aria-hidden="true" size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="p-5 sm:p-6">{children}</div>

        {footer && <div className="border-t border-rule p-5 pt-0 sm:p-6">{footer}</div>}
      </div>
    </div>
  )
}
