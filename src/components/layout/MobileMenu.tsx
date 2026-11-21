import { createPortal } from 'react-dom'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'

import { Container } from '@/components/common/Container'
import { Logo } from '@/components/common/Logo'
import { institutionalNavigation, legalNavigation, primaryNavigation } from '@/config/navigation'
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/hooks'
import { paths } from '@/routes/paths'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useLockBodyScroll(open)
  useEscapeKey(onClose, open)
  useFocusTrap(open, dialogRef)

  if (!open) {
    return null
  }

  return createPortal(
    <div
      ref={dialogRef}
      id="mobile-navigation"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación principal"
      tabIndex={-1}
      className="fixed inset-0 z-[100] overflow-y-auto bg-paper"
    >
      <div className="h-1 bg-brand" />

      <div className="border-b border-rule bg-paper-strong">
        <Container className="flex min-h-20 items-center justify-between gap-4">
          <Logo compact onNavigate={onClose} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="inline-flex h-10 w-10 items-center justify-center border border-rule-strong text-ink transition-colors hover:border-ink hover:bg-paper"
          >
            <X aria-hidden="true" size={20} strokeWidth={1.6} />
          </button>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
          <nav aria-label="Navegación móvil">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
              Secciones
            </p>
            <ul className="mt-3 divide-y divide-rule border-y border-rule">
              {primaryNavigation.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className="group flex items-center justify-between gap-4 py-3.5"
                  >
                    <span className="font-serif text-2xl font-medium tracking-[-0.02em] text-ink transition-colors group-hover:text-brand">
                      {item.label}
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.5}
                      className="text-ink-muted transition-colors group-hover:text-brand"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
                Buscar
              </p>
              <Link
                to={paths.search}
                onClick={onClose}
                className="mt-3 flex items-center justify-between gap-4 border border-rule bg-paper-strong px-4 py-4 text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
              >
                Encuentra una noticia
                <Search aria-hidden="true" size={18} strokeWidth={1.6} />
              </Link>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
                El portal
              </p>
              <ul className="mt-3 space-y-2.5">
                {[...institutionalNavigation, ...legalNavigation].map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className="text-sm text-ink-muted transition-colors hover:text-brand"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-rule pt-5">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                Portal en preparación · Fase 1
              </p>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                Todavía no hay noticias publicadas. La primera edición está en preparación.
              </p>
            </div>
          </div>
        </div>

      </Container>
    </div>,
    document.body,
  )
}
