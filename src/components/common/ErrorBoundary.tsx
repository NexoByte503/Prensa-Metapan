import { Component, type ErrorInfo, type ReactNode } from 'react'

import { siteConfig } from '@/config/site'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Last line of defence for unexpected rendering errors.
 * Route-level errors are handled by RouteErrorPage.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Prensa Metapán] Error de renderizado no controlado:', error, errorInfo)
    document.title = `Error inesperado · ${siteConfig.name}`
  }

  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand">
          Error inesperado
        </p>
        <p className="mt-4 font-serif text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
          Prensa Metapán
        </p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
          El sitio no pudo cargarse correctamente. Recarga la página o vuelve al inicio. Si el
          problema continúa, inténtalo más tarde.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-brand px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-dark"
          >
            Recargar página
          </button>
          <a
            href="/"
            className="border border-rule-strong bg-paper-strong px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }
}
