import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'
import { queryClient } from '@/api/queryClient'
import { tokenStore } from '@/features/auth/tokenStore'

configure({ asyncUtilTimeout: 3000 })

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
