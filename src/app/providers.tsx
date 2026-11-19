import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { configureApi } from '@/api/client'
import { queryClient } from '@/api/queryClient'
import { API_BASE_URL } from '@/config'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { tokenStore } from '@/features/auth/tokenStore'

configureApi({
  baseUrl: API_BASE_URL,
  getToken: tokenStore.get,
  onUnauthorized: () => {
    tokenStore.clear('expired')
    queryClient.clear()
  },
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
