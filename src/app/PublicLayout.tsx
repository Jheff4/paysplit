import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { Logo } from '@/components/Logo'
import { NavigationProgress } from '@/components/NavigationProgress'

function usePrefetchSignedInShell() {
  useEffect(() => {
    const load = () => void import('./ProtectedShell')
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(load, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = setTimeout(load, 2000)
    return () => clearTimeout(timer)
  }, [])
}

export function PublicLayout() {
  usePrefetchSignedInShell()
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(120%_80%_at_0%_100%,#0f324a_0%,#000_60%)] px-4 pb-10 sm:px-9">
      <NavigationProgress />
      <header className="flex h-[102px] items-center">
        <Logo tone="light" />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center sm:items-center">
        <div className="w-full max-w-[540px] overflow-hidden rounded-[20px] bg-surface shadow-modal">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
