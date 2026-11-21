import { RefreshCcw, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PageLoading } from '@/components/common/PageLoading'
import { Seo } from '@/components/seo/Seo'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'

function AccessError({ message }: { message: string | null }) {
  const { refreshProfile, signOut } = useAuth()
  const [isRetrying, setIsRetrying] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleRetry(): Promise<void> {
    setIsRetrying(true)

    try {
      await refreshProfile()
    } finally {
      setIsRetrying(false)
    }
  }

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true)

    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
      <Seo title="Acceso restringido" path={paths.admin} noIndex />
      <div className="w-full max-w-md border border-rule bg-paper-strong p-7 text-center shadow-editorial">
        <ShieldAlert
          aria-hidden="true"
          size={28}
          strokeWidth={1.5}
          className="mx-auto text-brand"
        />
        <h1 className="mt-4 font-serif text-2xl font-semibold tracking-[-0.02em]">
          No se pudo verificar el acceso
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {message ??
            'La sesión existe, pero el perfil editorial no está disponible. Vuelve a intentarlo o inicia sesión nuevamente.'}
        </p>

        <div className="mt-6 grid gap-2.5">
          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={isRetrying}
            className="inline-flex items-center justify-center gap-2 bg-brand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw aria-hidden="true" size={15} strokeWidth={1.8} />
            {isRetrying ? 'Verificando…' : 'Reintentar'}
          </button>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="inline-flex items-center justify-center border border-rule-strong bg-paper-strong px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink transition-colors hover:border-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Client-side navigation guard. It improves the experience, but the real
 * authorization boundary is Supabase RLS combined with the editorial role.
 */
export function RequireAuth() {
  const { status, user, profile, error } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper">
        <PageLoading />
      </div>
    )
  }

  if (status === 'unconfigured') {
    return (
      <Navigate
        to={paths.adminLogin}
        replace
        state={{ from: `${location.pathname}${location.search}`, reason: 'unconfigured' }}
      />
    )
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <Navigate
        to={paths.adminLogin}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (status === 'error' || !profile) {
    return <AccessError message={error} />
  }

  return <Outlet />
}
