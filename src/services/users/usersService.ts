import { getSupabaseClient } from '@/services/supabase'

import { UsersServiceError } from './errors'

export type EditorialUserRole = 'admin' | 'editor'

export interface EditorialUser {
  readonly id: string
  readonly fullName: string
  readonly email: string
  readonly role: EditorialUserRole
  readonly avatarUrl: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

interface EditorialProfileRow {
  readonly id: string
  readonly full_name: string
  readonly email: string
  readonly role: string
  readonly avatar_url: string | null
  readonly created_at: string
  readonly updated_at: string
}

export async function fetchEditorialUsers(): Promise<EditorialUser[]> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, created_at, updated_at')
    .order('full_name', { ascending: true })
    .overrideTypes<EditorialProfileRow[], { merge: false }>()

  if (error) {
    throw new UsersServiceError('No se pudo cargar el equipo editorial.')
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role as EditorialUserRole,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }))
}

export async function setEditorialUserRole(
  targetUserId: string,
  newRole: EditorialUserRole,
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('admin_set_user_role', {
    target_user_id: targetUserId,
    new_role: newRole,
  })

  if (error) {
    throw new UsersServiceError('No se pudo actualizar el rol del usuario.')
  }
}

export async function inviteEditorialEditor(email: string, fullName: string): Promise<void> {
  const { error } = await getSupabaseClient().functions.invoke('admin-invite-editor', {
    body: { email: email.trim().toLowerCase(), fullName: fullName.trim() },
  })
  if (error) throw new UsersServiceError(error.message || 'No se pudo invitar al editor.')
}
