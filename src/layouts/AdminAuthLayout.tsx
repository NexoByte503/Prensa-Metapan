import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'
import { Link, Outlet, ScrollRestoration } from 'react-router-dom'

import { Container } from '@/components/common/Container'
import { Logo } from '@/components/common/Logo'
import { PageLoading } from '@/components/common/PageLoading'
import { paths } from '@/routes/paths'

export function AdminAuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <ScrollRestoration />

      <a
        href="#contenido-acceso"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-night-rule bg-night text-paper">
        <Container className="flex min-h-20 items-center justify-between gap-4">
          <Logo inverted />
          <span className="border border-night-rule px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Acceso editorial
          </span>
        </Container>
      </header>

      <main id="contenido-acceso" tabIndex={-1} className="flex-1 focus:outline-none">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-rule">
        <Container className="flex flex-col gap-2 py-5 text-[10px] uppercase tracking-[0.12em] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Fase 2 · Acceso restringido al equipo editorial</p>
          <Link
            to={paths.home}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-brand"
          >
            <ArrowLeft aria-hidden="true" size={12} strokeWidth={1.8} />
            Volver al portal
          </Link>
        </Container>
      </footer>
    </div>
  )
}
