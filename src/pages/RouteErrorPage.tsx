import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { Container } from '@/components/common/Container'
import { siteConfig } from '@/config/site'

function getErrorContent(error: unknown): {
  code: string
  title: string
  description: string
  devMessage?: string
} {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        code: '404',
        title: 'No pudimos encontrar esta página.',
        description:
          'La dirección solicitada no existe o el contenido todavía no está disponible.',
      }
    }

    return {
      code: String(error.status),
      title: 'No pudimos completar la solicitud.',
      description:
        'Ocurrió un problema al cargar esta sección. Intenta recargar la página o vuelve al inicio.',
    }
  }

  return {
    code: 'Error',
    title: 'Algo salió mal al cargar el portal.',
    description:
      'Se produjo un error inesperado en la aplicación. Recarga la página o vuelve al inicio.',
    devMessage: import.meta.env.DEV && error instanceof Error ? error.message : undefined,
  }
}

export default function RouteErrorPage() {
  const error = useRouteError()
  const content = getErrorContent(error)

  useEffect(() => {
    document.title = `${content.code} · ${siteConfig.name}`
  }, [content.code])

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="h-1 bg-brand" />

      <div className="border-b border-rule bg-paper-strong">
        <Container className="flex min-h-20 items-center">
          <span className="inline-flex flex-col gap-1.5">
            <span className="font-serif text-[2.1rem] font-semibold leading-none tracking-[-0.035em] text-ink">
              Prensa <span className="text-brand">Metapán</span>
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-ink-muted">
              Periodismo local · El Salvador
            </span>
          </span>
        </Container>
      </div>

      <main className="flex flex-1 items-center justify-center py-16">
        <Container className="flex max-w-2xl flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-rule bg-paper-strong text-brand">
            <AlertTriangle aria-hidden="true" size={22} strokeWidth={1.6} />
          </span>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
            {content.code === 'Error' ? 'Error de aplicación' : `Error ${content.code}`}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-muted">
            {content.description}
          </p>

          {content.devMessage && (
            <pre className="mt-6 max-w-full overflow-x-auto border border-rule bg-paper-strong p-4 text-left text-xs leading-relaxed text-ink-muted">
              {content.devMessage}
            </pre>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-brand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark"
            >
              <RefreshCw aria-hidden="true" size={15} strokeWidth={1.8} />
              Recargar página
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 border border-rule-strong bg-paper-strong px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink transition-colors hover:border-ink"
            >
              <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.8} />
              Volver al inicio
            </a>
          </div>
        </Container>
      </main>
    </div>
  )
}
