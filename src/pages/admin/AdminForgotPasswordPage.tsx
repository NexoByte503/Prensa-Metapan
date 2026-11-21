import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { AuthAlert, AuthCard } from '@/components/auth'
import { Container } from '@/components/common/Container'
import { Seo } from '@/components/seo/Seo'
import { isSupabaseConfigured } from '@/config/env'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'
import { getAuthErrorMessage } from '@/services/auth/errors'

const recoverySchema = z.object({
  email: z.string().trim().min(1, 'Ingresa tu correo.').email('Ingresa un correo válido.'),
})

type RecoveryFormValues = z.infer<typeof recoverySchema>

export default function AdminForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [wasSubmitted, setWasSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: '' },
  })

  async function handleRequest(values: RecoveryFormValues): Promise<void> {
    try {
      const redirectTo = new URL(paths.adminResetPassword, window.location.origin).toString()
      await requestPasswordReset(values.email, redirectTo)
      setWasSubmitted(true)
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
      <Seo title="Recuperar contraseña" path={paths.adminForgotPassword} noIndex />

      <Container className="flex justify-center py-10 sm:py-14 lg:py-20">
        <AuthCard
          kicker="Acceso editorial"
          title="Recupera tu contraseña"
          description="Escribe el correo de tu cuenta administrativa. Si está registrado, recibirás un enlace para crear una nueva contraseña."
          footer={
            <Link
              to={paths.adminLogin}
              className="inline-flex items-center gap-1.5 font-semibold text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:text-brand-dark"
            >
              <ArrowLeft aria-hidden="true" size={13} strokeWidth={1.8} />
              Volver al inicio de sesión
            </Link>
          }
        >
          {!isSupabaseConfigured && (
            <div className="mb-5">
              <AuthAlert tone="info">
                Supabase no está configurado. Define <code>VITE_SUPABASE_URL</code> y{' '}
                <code>VITE_SUPABASE_ANON_KEY</code> antes de solicitar un enlace.
              </AuthAlert>
            </div>
          )}

          {errors.root?.message && (
            <div className="mb-5">
              <AuthAlert tone="error">{errors.root.message}</AuthAlert>
            </div>
          )}

          {wasSubmitted ? (
            <div className="space-y-4">
              <AuthAlert tone="success">
                Si el correo pertenece a una cuenta editorial, recibirás un enlace para
                restablecer la contraseña. Revisa también la carpeta de spam.
              </AuthAlert>
              <p className="text-xs leading-relaxed text-ink-muted">
                Por seguridad, no confirmamos si un correo está registrado. El enlace caduca y
                solo puede usarse una vez.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleRequest)} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="recovery-email"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
                >
                  Correo electrónico
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="nombre@dominio.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'recovery-email-error' : undefined}
                  disabled={isDisabled}
                  className="mt-2 h-12 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-brand"
                  {...register('email')}
                />
                {errors.email && (
                  <p
                    id="recovery-email-error"
                    role="alert"
                    className="mt-2 text-xs text-brand"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className="inline-flex h-12 w-full items-center justify-center gap-2 bg-brand px-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  'Enviando…'
                ) : (
                  <>
                    Enviar enlace
                    <Mail aria-hidden="true" size={15} strokeWidth={1.8} />
                  </>
                )}
              </button>
            </form>
          )}
        </AuthCard>
      </Container>
    </>
  )
}
