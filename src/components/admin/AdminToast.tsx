import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type AdminToastTone = 'success' | 'error' | 'info'

export interface AdminToastItem {
  readonly id: number
  readonly tone: AdminToastTone
  readonly message: string
}

interface AdminToastContextValue {
  readonly push: (tone: AdminToastTone, message: string) => void
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null)

const TOAST_DURATION_MS = 4500

let toastId = 0

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AdminToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (tone: AdminToastTone, message: string) => {
      const id = ++toastId

      setToasts((current) => [...current.slice(-3), { id, tone, message }])

      window.setTimeout(() => {
        dismiss(id)
      }, TOAST_DURATION_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push }), [push])

  return (
    <AdminToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertCircle : Info

          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex items-start gap-2.5 border border-rule bg-paper-strong p-3.5 shadow-editorial"
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-brand" />
              <p className="flex-1 text-xs leading-relaxed text-ink">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar notificación"
                className="text-ink-muted transition-colors hover:text-ink"
              >
                <X aria-hidden="true" size={14} strokeWidth={1.8} />
              </button>
            </div>
          )
        })}
      </div>
    </AdminToastContext.Provider>
  )
}

export function useAdminToast(): AdminToastContextValue {
  const context = useContext(AdminToastContext)

  if (!context) {
    throw new Error('useAdminToast debe usarse dentro de un AdminToastProvider.')
  }

  return context
}
