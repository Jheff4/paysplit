import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { api } from '@/api/client'
import { tokenStore } from './tokenStore'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const token = useSyncExternalStore(tokenStore.subscribe, tokenStore.get, tokenStore.get)

  const signIn = useCallback(
    (next: string, remember: boolean) => {
      queryClient.clear()
      tokenStore.set(next, remember)
    },
    [queryClient],
  )

  const signOut = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      // Local sign-out still happens if the server call fails.
    }
    tokenStore.clear('signed_out')
    queryClient.clear()
  }, [queryClient])

  const value = useMemo(() => ({ token, signIn, signOut }), [token, signIn, signOut])
  return <AuthContext value={value}>{children}</AuthContext>
}
