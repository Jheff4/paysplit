import type { ReactNode } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router'
import { useAuth } from '@/features/auth/useAuth'
import { safeNextPath } from '@/lib/safeRedirect'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/sign-in?next=${next}`} replace />
  }
  return children
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [params] = useSearchParams()
  if (token) return <Navigate to={safeNextPath(params.get('next'))} replace />
  return children
}
