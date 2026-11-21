import { ArrowLeftRight, Bell, ChevronDown, House, LogOut, Search, Settings, Split, UserRound, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { AlertDialog, DropdownMenu } from 'radix-ui'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { Logo } from '@/components/Logo'
import { NavigationProgress } from '@/components/NavigationProgress'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { WelcomeDialog } from '@/features/auth/WelcomeDialog'
import { notificationKeys, notificationsApi } from '@/features/notifications/api'
import { cn } from '@/lib/cn'
import { warmRoute } from './prefetch'

const NAV = [
  { to: '/', label: 'Dashboard', short: 'Home', Icon: House, end: true },
  { to: '/transactions', label: 'Transactions', short: 'History', Icon: ArrowLeftRight, end: false },
  { to: '/destinations', label: 'Destination', short: 'Wallet', Icon: Wallet, end: false },
  { to: '/split-rules', label: 'Split Rules', short: 'Split Rules', Icon: Split, end: false },
] as const

const iconButtonClass =
  'grid size-10 place-items-center rounded-xl border border-line bg-surface text-ink hover:bg-canvas'

function SignOutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { signOut } = useAuth()
  const [pending, setPending] = useState(false)

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-surface p-6 shadow-modal">
          <AlertDialog.Title className="text-lg font-semibold text-heading">Sign out of PaySplit?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">
            This signs you out on all your devices. Your rules keep running.
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" className="flex-1">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="danger"
              className="flex-1"
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

function ProfileMenu({ onSignOut }: { onSignOut: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm text-ink hover:bg-canvas"
        >
          <span className="grid size-[23px] place-items-center rounded-full bg-brand-soft text-link">
            <UserRound aria-hidden="true" className="size-4" />
          </span>
          <ChevronDown aria-hidden="true" className="size-4 text-muted" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-48 rounded-xl border border-line bg-surface p-1 shadow-modal"
        >
          <DropdownMenu.Item asChild>
            <Link
              to="/settings"
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-ink outline-none data-[highlighted]:bg-canvas"
            >
              <Settings aria-hidden="true" className="size-4" />
              Profile & settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            onSelect={onSignOut}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm text-danger outline-none data-[highlighted]:bg-danger-soft"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function NotificationsLink() {
  const badge = useQuery({ queryKey: notificationKeys.badge, queryFn: notificationsApi.badge, refetchInterval: 60_000 })
  const unread = typeof badge.data?.unreadCount === 'number' ? badge.data.unreadCount : 0
  return (
    <Link
      to="/notifications"
      aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      className={cn(iconButtonClass, 'relative')}
    >
      <Bell aria-hidden="true" className="size-5" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}

export function AppShell() {
  const [signOutOpen, setSignOutOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-canvas pb-20 lg:pb-0">
      <NavigationProgress />
      <WelcomeDialog />
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex h-[63px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-9">
          <Link to="/" aria-label="Paysplit dashboard" className="lg:w-[216px]">
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden h-full lg:block">
            <ul className="flex h-full items-stretch">
              {NAV.map(({ to, label, end }) => (
                <li key={to} className="flex">
                  <NavLink
                    to={to}
                    end={end}
                    onPointerEnter={() => warmRoute(to)}
                    onFocus={() => warmRoute(to)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center border-b-4 px-3 pt-1 text-sm text-ink',
                        isActive ? 'border-brand font-semibold' : 'border-transparent hover:border-line',
                      )
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-3 lg:w-[216px]">
            <Link to="/transactions" aria-label="Search transactions" className={cn(iconButtonClass, 'hidden sm:grid')}>
              <Search aria-hidden="true" className="size-5" />
            </Link>
            <NotificationsLink />
            <ProfileMenu onSignOut={() => setSignOutOpen(true)} />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1440px] px-4 py-6 outline-none sm:px-9">
        <Outlet />
      </main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface lg:hidden">
        <ul className="grid grid-cols-4">
          {NAV.map(({ to, short, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onPointerDown={() => warmRoute(to)}
                onFocus={() => warmRoute(to)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 text-xs',
                    isActive ? 'font-semibold text-link' : 'text-muted',
                  )
                }
              >
                <Icon aria-hidden="true" className="size-6" />
                {short}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </div>
  )
}
