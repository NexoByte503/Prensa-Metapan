import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'

import { AuthAlert, AuthCard, PasswordField } from '@/components/auth'
import { Container } from '@/components/common/Container'
import { Seo } from '@/components/seo/Seo'
import { isSupabaseConfigured } from '@/config/env'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'
import { getAuthErrorMessage } from '@/services/auth/errors'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Ingresa tu correo.').email('Ingresa un correo válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginLocationState {
  passwordUpdated?: boolean
  reason?: string
  from?: string
}

function resolveLoginDestination(from: string | undefined): string {
  if (from && from.startsWith('/admin') && !from.startsWith('//')) {
    return from
  }

  return paths.admin
}

export default function AdminLoginPage() {
  const { status, error, signIn } = useAuth()
  const location = useLocation()
  const state = (location.state ?? {}) as LoginLocationState
  const redirectTo = resolveLoginDestination(state.from)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />
  }

  async function handleLogin(values: LoginFormValues): Promise<void> {
    try {
      await signIn(values.email, values.password)
    } catch (submitError) {
      setError('root', {
        message:
          submitError instanceof Error
            ? submitError.message
            : getAuthErrorMessage(submitError),
      })
    }
  }

  const isDisabled = !isSupabaseConfigured || isSubmitting

  return (
    <>
      <Seo title="Acceso editorial" path={paths.adminLogin} noIndex />

      <Container className="flex justify-center py-10 sm:py-14 lg:py-20">
        <AuthCard
          kicker="Acceso editorial"
          title="Inicia sesión"
          description="Área reservada al equipo de Prensa Metapán. Las cuentas se crean únicamente desde la administración de Supabase."
          footer={
            <p>
              ¿Olvidaste tu contraseña?{' '}
              <Link
                to={paths.adminForgotPassword}
                className="font-semibold text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:text-brand-dark"
              >
                Solicita un enlace
              </Link>
            </p>
          }
        >
          {!isSupabaseConfigured && (
            <div className="mb-5">
              <AuthAlert tone="info">
                Supabase no está configurado. Define <code>VITE_SUPABASE_URL</code> y{' '}
                <code>VITE_SUPABASE_ANON_KEY</code> en <code>.env</code>, reinicia Vite y
                recarga esta página.
              </AuthAlert>
            </div>
          )}

          {state.passwordUpdated && (
            <div className="mb-5">
              <AuthAlert tone="success">
                Contraseña actualizada. Inicia sesión nuevamente con tu nueva contraseña.
              </AuthAlert>
            </div>
          )}

          {state.reason === 'unconfigured' && isSupabaseConfigured && (
            <div className="mb-5">
              <AuthAlert tone="info">
                El acceso editorial requiere una configuración válida de Supabase.
              </AuthAlert>
            </div>
          )}

          {(errors.root?.message || (error && status === 'error')) && (
            <div className="mb-5">
              <AuthAlert tone="error">{errors.root?.message ?? error}</AuthAlert>
            </div>
          )}

          <form onSubmit={handleSubmit(handleLogin)} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
              >
                Correo electrónico
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="nombre@dominio.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'admin-email-error' : undefined}
                disabled={isDisabled}
                className="mt-2 h-12 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-brand"
                {...register('email')}
              />
              {errors.email && (
                <p id="admin-email-error" role="alert" className="mt-2 text-xs text-brand">
                  {errors.email.message}
                </p>
              )}
            </div>

            <PasswordField
              label="Contraseña"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              error={errors.password?.message}
              disabled={isDisabled}
              {...register('password')}
            />

            <button
              type="submit"
              disabled={isDisabled}
              className="inline-flex h-12 w-full items-center justify-center gap-2 bg-brand px-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                'Verificando…'
              ) : (
                <>
                  Entrar al panel
                  <LogIn aria-hidden="true" size={15} strokeWidth={1.8} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-rule pt-4 text-xs leading-relaxed text-ink-muted">
            <p className="flex items-start gap-2">
              <ArrowRight
                aria-hidden="true"
                size={14}
                strokeWidth={1.7}
                className="mt-0.5 shrink-0 text-brand"
              />
              No existe registro público de usuarios. Si necesitas acceso, contacta a la
              administración del portal.
            </p>
          </div>
        </AuthCard>
      </Container>
    </>
  )
}
