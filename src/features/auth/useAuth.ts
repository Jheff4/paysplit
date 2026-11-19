import { createContext, use } from 'react'

export type AuthContextValue = {
  token: string | null
  signIn: (token: string, remember: boolean) => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
