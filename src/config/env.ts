
import { z } from 'zod'

/**
 * Empty strings in `.env` files are treated as "not configured".
 * The public portal works without Supabase; the admin area requires both
 * Supabase variables to be present and valid.
 */
const optionalText = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : value,
  z.string().trim().optional(),
)

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : value,
  z.string().url().optional(),
)

const environmentSchema = z.object({
  VITE_SITE_URL: optionalUrl,
  VITE_SOCIAL_IMAGE: optionalUrl,
  VITE_GOOGLE_SITE_VERIFICATION: optionalText,

  VITE_SITE_INDEXABLE: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === ''
        ? undefined
        : value,
    z.enum(['true', 'false']).optional(),
  ),

  VITE_SUPABASE_URL: optionalUrl,
  VITE_SUPABASE_ANON_KEY: optionalText,
})

const parsedEnvironment = environmentSchema.safeParse(import.meta.env)

if (!parsedEnvironment.success && import.meta.env.DEV) {
  const invalidKeys = parsedEnvironment.error.issues
    .map((issue) => issue.path.join('.'))
    .filter(Boolean)
    .join(', ')

  console.warn(
    `[Prensa Metapán] Variables de entorno inválidas o incompletas: ${
      invalidKeys || 'desconocidas'
    }. Revisa .env.example.`,
  )
}

const rawEnvironment = parsedEnvironment.success
  ? parsedEnvironment.data
  : {}

/** Validated, typed access to the public Vite environment. */
export const env = {
  siteUrl: rawEnvironment.VITE_SITE_URL,
  socialImage: rawEnvironment.VITE_SOCIAL_IMAGE,
  googleSiteVerification: rawEnvironment.VITE_GOOGLE_SITE_VERIFICATION,
  siteIndexable: rawEnvironment.VITE_SITE_INDEXABLE === 'true',
  supabaseUrl: rawEnvironment.VITE_SUPABASE_URL,
  supabasePublishableKey: rawEnvironment.VITE_SUPABASE_ANON_KEY,
} as const

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabasePublishableKey,
)

export const isSupabasePartiallyConfigured =
  Boolean(env.supabaseUrl || env.supabasePublishableKey) &&
  !isSupabaseConfigured
