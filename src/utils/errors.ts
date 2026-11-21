const DEFAULT_ERROR_MESSAGE =
  'Ocurrió un error inesperado. Intenta nuevamente en unos minutos.'

/** Extracts a safe, user-facing message from an unknown error. */
export function getErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR_MESSAGE,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return fallback
}
