import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { queryClient } from '@/api/queryClient'
import { tokenStore } from '@/features/auth/tokenStore'

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

afterEach(() => {
  cleanup()
  tokenStore.clear()
  queryClient.clear()
  sessionStorage.clear()
  localStorage.clear()
})
