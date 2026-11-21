import type { Session, User } from '@supabase/supabase-js'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { isSupabaseConfigured } from '@/config/env'
import {
  getProfile,
  ProfileAccessError,
  ProfileNotFoundError,
  requestPasswordReset,
  signInWithPassword,
  signOut,
  updatePassword,
} from '@/services/auth'
import { getAuthErrorMessage } from '@/services/auth/errors'
import { getSupabaseClient } from '@/services/supabase'
import type { ProfileRow } from '@/types'

import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

interface AuthState {
  readonly status: AuthStatus
  readonly user: User | null
  readonly session: Session | null
  readonly profile: ProfileRow | null
  readonly error: string | null
}

const initialState: AuthState = {
  status: isSupabaseConfigured ? 'loading' : 'unconfigured',
  user: null,
  session: null,
  profile: null,
  error: null,
}

function unauthenticatedState(): AuthState {
  return {
    status: 'unauthenticated',
    user: null,
    session: null,
    profile: null,
    error: null,
  }
}

interface AuthProviderProps {
  children: ReactNode
}

function profileErrorMessage(error: unknown): string {
  if (error instanceof ProfileNotFoundError || error instanceof ProfileAccessError) {
    return error.message
  }

  return getAuthErrorMessage(error)
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState)
  const mountedRef = useRef(true)
  const profileRequestRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadProfile = useCallback(
    async (user: User, session: Session | null): Promise<void> => {
      const requestId = profileRequestRef.current + 1
      profileRequestRef.current = requestId

      try {
        const profile = await getProfile(user.id)

        if (!mountedRef.current || requestId !== profileRequestRef.current) {
          return
        }

        setState({
          status: 'authenticated',
          user,
          session,
          profile,
          error: null,
        })
      } catch (error) {
        if (!mountedRef.current || requestId !== profileRequestRef.current) {
          return
        }

        setState({
          status: 'error',
          user,
          session,
          profile: null,
          error: profileErrorMessage(error),
        })
      }
    },
    [],
  )

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    let active = true

    let client

    try {
      client = getSupabaseClient()
    } catch (error) {
      setState({
        status: 'error',
        user: null,
        session: null,
        profile: null,
        error: getAuthErrorMessage(error),
      })
      return
    }

    const { data: subscription } = client.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return
      }

      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        return
      }

      if (!session?.user) {
        profileRequestRef.current += 1
        setState(unauthenticatedState())
        return
      }

      setState({
        status: 'loading',
        user: session.user,
        session,
        profile: null,
        error: null,
      })

      // Evita bloquear el callback interno de Supabase Auth con consultas.
      window.setTimeout(() => {
        if (active) {
          void loadProfile(session.user, session)
        }
      }, 0)
    })

    void client.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return
      }

      if (error) {
        setState({
          status: 'error',
          user: null,
          session: null,
          profile: null,
          error: getAuthErrorMessage(error),
        })
        return
      }

      if (!data.session?.user) {
        setState(unauthenticatedState())
        return
      }

      setState({
        status: 'loading',
        user: data.session.user,
        session: data.session,
        profile: null,
        error: null,
      })

      void loadProfile(data.session.user, data.session)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [loadProfile])

  const handleSignIn = useCallback(async (email: string, password: string): Promise<void> => {
    const result = await signInWithPassword(email, password)

    if (mountedRef.current) {
      setState({
        status: 'loading',
        user: result.user,
        session: result.session,
        profile: null,
        error: null,
      })
    }

    await loadProfile(result.user, result.session)
  }, [loadProfile])

  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut()

    if (mountedRef.current) {
      profileRequestRef.current += 1
      setState(unauthenticatedState())
    }
  }, [])

  const handleRequestPasswordReset = useCallback(
    async (email: string, redirectTo: string): Promise<void> => {
      await requestPasswordReset(email, redirectTo)
    },
    [],
  )

  const handleUpdatePassword = useCallback(async (password: string): Promise<void> => {
    await updatePassword(password)
  }, [])

  const handleRefreshProfile = useCallback(async (): Promise<void> => {
    if (state.user) {
      await loadProfile(state.user, state.session)
    }
  }, [loadProfile, state.session, state.user])

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      session: state.session,
      profile: state.profile,
      error: state.error,
      isAdmin: state.profile?.role === 'admin',
      isEditor: state.profile?.role === 'editor',
      isStaff: state.profile?.role === 'admin' || state.profile?.role === 'editor',
      signIn: handleSignIn,
      signOut: handleSignOut,
      requestPasswordReset: handleRequestPasswordReset,
      updatePassword: handleUpdatePassword,
      refreshProfile: handleRefreshProfile,
    }),
    [
      state,
      handleSignIn,
      handleSignOut,
      handleRequestPasswordReset,
      handleUpdatePassword,
      handleRefreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
