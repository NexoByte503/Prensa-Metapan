import type { Session, User } from '@supabase/supabase-js'

import { getSupabaseClient } from '@/services/supabase'
import type { ProfileRow } from '@/types'

import { getAuthErrorMessage } from './errors'

export class ProfileNotFoundError extends Error {
  constructor() {
    super(
      'No existe un perfil editorial asociado a esta cuenta. Contacta a la administración.',
    )
    this.name = 'ProfileNotFoundError'
  }
}

export class ProfileAccessError extends Error {
  constructor() {
    super('No se pudo verificar el perfil editorial. Intenta nuevamente.')
    this.name = 'ProfileAccessError'
  }
}

export interface SignInResult {
  readonly user: User
  readonly session: Session
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    throw new Error(getAuthErrorMessage(error))
  }

  if (!data.user || !data.session) {
    throw new Error('No se pudo iniciar la sesión. Intenta nuevamente.')
  }

  return { user: data.user, session: data.session }
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut()

  if (error) {
    throw new Error(getAuthErrorMessage(error))
  }
}

export async function requestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<void> {
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  })

  if (error) {
    throw new Error(getAuthErrorMessage(error))
  }
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.updateUser({ password })

  if (error) {
    throw new Error(getAuthErrorMessage(error))
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession()

  if (error) {
    throw new Error(getAuthErrorMessage(error))
  }

  return data.session
}

export async function getProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new ProfileAccessError()
  }

  if (!data) {
    throw new ProfileNotFoundError()
  }

  return data
}
