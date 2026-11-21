import { ExternalLink, LogOut, Menu, ShieldCheck } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Link, Outlet, ScrollRestoration } from 'react-router-dom'

import { Container } from '@/components/common/Container'
import { Logo } from '@/components/common/Logo'
import { PageLoading } from '@/components/common/PageLoading'
import { AdminToastProvider } from '@/components/admin/AdminToast'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const roleLabel = profile?.role === 'admin' ? 'Administrador' : 'Editor'

  async function handleSignOut(): Promise<void> {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)
    setSignOutError(null)

    try {
      await signOut()
    } catch (error) {
      setSignOutError(
        error instanceof Error
          ? error.message
          : 'No se pudo cerrar la sesión. Intenta nuevamente.',
      )
      setIsSigningOut(false)
    }
  }

  return (
    <AdminToastProvider>
    <div className="flex min-h-dvh flex-col bg-paper">
      <ScrollRestoration />

      <a
        href="#contenido-admin"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-night-rule bg-night text-paper">
        <Container className="flex min-h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú" className="inline-flex h-9 w-9 items-center justify-center border border-night-rule text-paper/70 md:hidden">
              <Menu aria-hidden="true" size={17} />
            </button>
            <Logo inverted compact />
            <span className="hidden border-l border-night-rule pl-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:block">
              Panel editorial
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to={paths.home}
              className="hidden items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-paper md:inline-flex"
            >
              Ver portal
              <ExternalLink aria-hidden="true" size={13} strokeWidth={1.7} />
            </Link>

            <div className="hidden border-l border-night-rule pl-4 text-right lg:block">
              <p className="max-w-44 truncate text-[11px] font-semibold text-paper">
                {profile?.full_name ?? 'Sesión editorial'}
              </p>
              <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45">
                {roleLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              aria-label="Cerrar sesión"
              className="inline-flex items-center gap-2 border border-night-rule px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut aria-hidden="true" size={13} strokeWidth={1.7} />
              <span className="hidden sm:inline">
                {isSigningOut ? 'Saliendo…' : 'Salir'}
              </span>
            </button>
          </div>
        </Container>
      </header>

      {signOutError && (
        <div role="alert" className="border-b border-brand/20 bg-brand-soft/60">
          <Container className="flex items-center gap-2 py-3 text-xs text-ink">
            <ShieldCheck aria-hidden="true" size={15} strokeWidth={1.7} className="text-brand" />
            {signOutError}
          </Container>
        </div>
      )}

      <div className="flex flex-1 md:items-stretch">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
      <main id="contenido-admin" tabIndex={-1} className="flex-1 focus:outline-none">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-rule">
        <Container className="flex flex-col gap-2 py-5 text-[10px] uppercase tracking-[0.12em] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Sesión autenticada · Fase 2</p>
          <p>Panel editorial en preparación</p>
        </Container>
      </footer>
      </div>
      </div>
    </div>
    </AdminToastProvider>
  )
}
