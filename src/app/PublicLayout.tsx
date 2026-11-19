import { Outlet } from 'react-router'
import { Logo } from '@/components/Logo'

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-canvas px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <main id="main" className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-sm sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}
