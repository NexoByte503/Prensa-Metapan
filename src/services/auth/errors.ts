import { SupabaseConfigurationError } from '@/services/supabase'

interface ErrorWithCode {
  code?: string
  status?: number
  message?: string
}

const authErrorMessages: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed:
    'El correo todavía no está confirmado. Contacta a la administración del portal.',
  email_address_invalid: 'El correo electrónico no es válido.',
  weak_password: 'La contraseña no cumple los requisitos mínimos de seguridad.',
  same_password: 'La nueva contraseña debe ser diferente a la anterior.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos antes de volver a probar.',
  over_email_send_rate_limit:
    'Se enviaron demasiados correos. Espera unos minutos antes de solicitar otro enlace.',
  session_not_found: 'La sesión expiró. Inicia sesión nuevamente.',
  session_expired: 'La sesión expiró. Inicia sesión nuevamente.',
  refresh_token_not_found: 'La sesión expiró. Inicia sesión nuevamente.',
  reauthentication_needed: 'Por seguridad, vuelve a iniciar sesión para continuar.',
}

/**
 * Converts Supabase auth errors into safe, user-facing Spanish messages.
 * Raw backend details are intentionally not exposed in the UI.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof SupabaseConfigurationError) {
    return error.message
  }

  if (error && typeof error === 'object') {
    const candidate = error as ErrorWithCode
    const mappedMessage = candidate.code ? authErrorMessages[candidate.code] : undefined

    if (mappedMessage) {
      return mappedMessage
    }

    if (candidate.status === 429) {
      return 'Demasiados intentos. Espera unos minutos antes de volver a probar.'
    }

    if (candidate.message?.toLowerCase().includes('failed to fetch')) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.'
    }
  }

  return 'No se pudo completar la operación. Intenta nuevamente en unos minutos.'
}
