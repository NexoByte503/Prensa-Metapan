import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, KeyRound, ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { AuthAlert, AuthCard, PasswordField } from '@/components/auth'
import { Container } from '@/components/common/Container'
import { PageLoading } from '@/components/common/PageLoading'
import { Seo } from '@/components/seo/Seo'
import { isSupabaseConfigured } from '@/config/env'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'
import { getAuthErrorMessage } from '@/services/auth/errors'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Usa al menos 8 caracteres.')
      .max(72, 'Usa 72 caracteres o menos.'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

export default function AdminResetPasswordPage() {
  const { status, user, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function handleReset(values: ResetFormValues): Promise<void> {
    try {
      await updatePassword(values.password)
      await signOut()
      navigate(paths.adminLogin, {
        replace: true,
        state: { passwordUpdated: true },
      })
    } catch (submitError) {
      setError('root', {
        message:
          submitError instanceof Error
            ? submitError.message
            : getAuthErrorMessage(submitError),
      })
    }
  }

  if (status === 'loading') {
    return (
      <>
        <Seo title="Restablecer contraseña" path={paths.adminResetPassword} noIndex />
        <PageLoading />
      </>
    )
  }

  if (!isSupabaseConfigured || status === 'unconfigured') {
    return (
      <>
        <Seo title="Restablecer contraseña" path={paths.adminResetPassword} noIndex />
        <Container className="flex justify-center py-10 sm:py-14 lg:py-20">
          <AuthCard
            kicker="Acceso editorial"
            title="Configuración pendiente"
            description="El portal todavía no tiene una conexión de Supabase configurada."
            footer={
              <Link
                to={paths.adminLogin}
                className="inline-flex items-center gap-1.5 font-semibold text-brand underline decoration-brand/30 underline-offset-4"
              >
                <ArrowLeft aria-hidden="true" size={13} strokeWidth={1.8} />
                Volver al inicio de sesión
              </Link>
            }
          >
            <AuthAlert tone="info">
              Define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en{' '}
              <code>.env</code> y reinicia la aplicación.
            </AuthAlert>
          </AuthCard>
        </Container>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Seo title="Restablecer contraseña" path={paths.adminResetPassword} noIndex />
        <Container className="flex justify-center py-10 sm:py-14 lg:py-20">
          <AuthCard
            kicker="Acceso editorial"
            title="Enlace no válido"
            description="Este enlace de recuperación caducó, ya fue utilizado o no contiene una sesión válida."
            footer={
              <Link
                to={paths.adminLogin}
                className="inline-flex items-center gap-1.5 font-semibold text-brand underline decoration-brand/30 underline-offset-4"
              >
                <ArrowLeft aria-hidden="true" size={13} strokeWidth={1.8} />
                Volver al inicio de sesión
              </Link>
            }
          >
            <div className="space-y-4">
              <AuthAlert tone="info">
                Solicita un nuevo enlace desde la pantalla de recuperación. Por seguridad, los
                enlaces tienen vigencia limitada.
              </AuthAlert>
              <Link
                to={paths.adminForgotPassword}
                className="inline-flex h-12 w-full items-center justify-center gap-2 bg-brand px-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark"
              >
                Solicitar otro enlace
                <KeyRound aria-hidden="true" size={15} strokeWidth={1.8} />
              </Link>
            </div>
          </AuthCard>
        </Container>
      </>
    )
  }

  return (
    <>
      <Seo title="Restablecer contraseña" path={paths.adminResetPassword} noIndex />

      <Container className="flex justify-center py-10 sm:py-14 lg:py-20">
        <AuthCard
          kicker="Acceso editorial"
          title="Crea una nueva contraseña"
          description="La sesión de recuperación fue verificada. Al guardar, se cerrará la sesión para que inicies con la nueva contraseña."
          footer={
            <Link
              to={paths.adminLogin}
              className="inline-flex items-center gap-1.5 font-semibold text-brand underline decoration-brand/30 underline-offset-4"
            >
              <ArrowLeft aria-hidden="true" size={13} strokeWidth={1.8} />
              Volver al inicio de sesión
            </Link>
          }
        >
          {errors.root?.message && (
            <div className="mb-5">
              <AuthAlert tone="error">{errors.root.message}</AuthAlert>
            </div>
          )}

          <form onSubmit={handleSubmit(handleReset)} noValidate className="space-y-5">
            <PasswordField
              label="Nueva contraseña"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              hint="Usa una contraseña única que no reutilices en otros servicios."
              error={errors.password?.message}
              disabled={isSubmitting}
              {...register('password')}
            />

            <PasswordField
              label="Confirmar contraseña"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              error={errors.confirmPassword?.message}
              disabled={isSubmitting}
              {...register('confirmPassword')}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 bg-brand px-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                'Guardando…'
              ) : (
                <>
                  Guardar contraseña
                  <KeyRound aria-hidden="true" size={15} strokeWidth={1.8} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 border-t border-rule pt-4 text-xs leading-relaxed text-ink-muted">
            <ShieldAlert
              aria-hidden="true"
              size={14}
              strokeWidth={1.7}
              className="mt-0.5 shrink-0 text-brand"
            />
            <p>
              Si no solicitaste este cambio, cierra esta página y avisa a la administración del
              portal.
            </p>
          </div>
        </AuthCard>
      </Container>
    </>
  )
}
