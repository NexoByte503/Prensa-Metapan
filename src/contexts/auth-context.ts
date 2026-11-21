import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import type { ProfileRow } from '@/types'

export type AuthStatus =
  | 'unconfigured'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error'

export interface AuthContextValue {
  readonly status: AuthStatus
  readonly user: User | null
  readonly session: Session | null
  readonly profile: ProfileRow | null
  readonly error: string | null
  readonly isAdmin: boolean
  readonly isEditor: boolean
  readonly isStaff: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string, redirectTo: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
