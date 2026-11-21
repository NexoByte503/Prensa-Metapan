
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, isSupabaseConfigured } from '@/config/env'
import type { Database } from '@/types'

export type TypedSupabaseClient = SupabaseClient<Database>

let supabaseClient: TypedSupabaseClient | null = null

export class SupabaseConfigurationError extends Error {
  constructor(message?: string) {
    super(
      message ??
        'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.',
    )
    this.name = 'SupabaseConfigurationError'
  }
}

/**
 * Returns a lazily created, typed Supabase browser client.
 * Only the public publishable key belongs in the frontend.
 */
export function getSupabaseClient(): TypedSupabaseClient {
  if (
    !isSupabaseConfigured ||
    !env.supabaseUrl ||
    !env.supabasePublishableKey
  ) {
    throw new SupabaseConfigurationError()
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient<Database>(
        env.supabaseUrl,
        env.supabasePublishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'prensa-metapan-auth',
          },
          db: {
            schema: 'public',
          },
        },
      )
    } catch {
      throw new SupabaseConfigurationError(
        'No se pudo inicializar Supabase. Revisa la URL y la Publishable Key.',
      )
    }
  }

  return supabaseClient
}

/** Clears the singleton; intended for tests and explicit environment resets. */
export function resetSupabaseClient(): void {
  supabaseClient = null
}
