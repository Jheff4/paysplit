import {
  ArrowLeftRight,
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Split,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { AlertDialog, Dialog } from 'radix-ui'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/wallets', label: 'Wallets', Icon: Wallet },
  { to: '/beneficiaries', label: 'Beneficiaries', Icon: Users },
  { to: '/split-rules', label: 'Split rules', Icon: Split },
  { to: '/transactions', label: 'Transactions', Icon: ArrowLeftRight },
  { to: '/notifications', label: 'Notifications', Icon: Bell },
  { to: '/settings', label: 'Settings', Icon: Settings },
] as const

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV.map(({ to, label, Icon, ...rest }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={'end' in rest}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium',
                isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-canvas hover:text-ink',
              )
            }
          >
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function SignOutButton() {
  const { signOut } = useAuth()
  const [pending, setPending] = useState(false)

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 px-3 text-muted">
          <LogOut aria-hidden="true" className="size-5" />
          Sign out
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-ink/50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-xl">
          <AlertDialog.Title className="text-lg font-semibold">Sign out of PaySplit?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">
            This signs you out on all your devices. Your rules keep running.
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialog.Cancel>
            <Button
              variant="danger"
              loading={pending}
              onClick={async () => {
                setPending(true)
                await signOut()
              }}
            >
              Sign out
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <aside className="hidden border-r border-line bg-surface md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        <div className="p-5">
          <Link to="/" aria-label="PaySplit dashboard">
            <Logo />
          </Link>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
          <NavLinks />
        </nav>
        <div className="border-t border-line p-3">
          <SignOutButton />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <Link to="/" aria-label="PaySplit dashboard">
          <Logo />
        </Link>
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger asChild>
            <Button variant="ghost" size="md" aria-label="Open menu" className="px-2">
              <Menu aria-hidden="true" className="size-6" />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/50" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl">
              <div className="flex items-center justify-between p-4">
                <Dialog.Title className="text-base font-semibold">Menu</Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="ghost" aria-label="Close menu" className="px-2">
                    <X aria-hidden="true" className="size-6" />
                  </Button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">Main navigation</Dialog.Description>
              <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
                <NavLinks onNavigate={() => setMenuOpen(false)} />
              </nav>
              <div className="border-t border-line p-3">
                <SignOutButton />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-6 outline-none sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
