import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

import { AdminModal } from '@/components/admin/AdminModal'

interface ConfirmDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onConfirm: () => void
  readonly title: string
  readonly message: ReactNode
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly isSubmitting?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isSubmitting = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    if (isSubmitting) {
      return
    }

    onConfirm()
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Esta acción se registra en la auditoría editorial."
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand-soft/60 text-brand">
          <AlertTriangle aria-hidden="true" size={18} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 text-sm leading-relaxed text-ink-muted">{message}</div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="border border-rule-strong bg-paper-strong px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="bg-brand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </AdminModal>
  )
}
