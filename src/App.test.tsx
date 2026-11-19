import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { api } from './api/client'
import { queryClient } from './api/queryClient'
import { AppProviders } from './app/providers'
import { routes } from './app/routes'
import { tokenStore } from './features/auth/tokenStore'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return router
}

afterEach(() => {
  tokenStore.clear()
  queryClient.clear()
  vi.unstubAllGlobals()
})

test('a signed-out visitor to a private page is sent to sign in, keeping where they were going', async () => {
  const router = renderAt('/wallets?tab=all')
  expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/sign-in')
  expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/wallets?tab=all')}`)
})

test('a signed-in user sees the app with navigation', async () => {
  tokenStore.set('token', false)
  renderAt('/')
  expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  expect(screen.getAllByRole('navigation', { name: 'Main' })[0]).toBeInTheDocument()
})

test('an expired session anywhere returns the user to sign in and wipes cached data', async () => {
  tokenStore.set('token', false)
  queryClient.setQueryData(['private'], { balance: 1 })
  renderAt('/transactions')
  await screen.findByRole('heading', { level: 1, name: 'Transactions' })

  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ statusCode: 401 }), { status: 401 })),
  )
  await api('/auth/me').catch(() => undefined)

  expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
  expect(queryClient.getQueryData(['private'])).toBeUndefined()
  expect(tokenStore.lastSignOutReason()).toBe('expired')
})

test('sign out asks for confirmation and explains it signs out every device', async () => {
  tokenStore.set('token', false)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
  renderAt('/')
  const user = userEvent.setup()

  await user.click((await screen.findAllByRole('button', { name: 'Sign out' }))[0]!)
  const dialog = await screen.findByRole('alertdialog', { name: 'Sign out of PaySplit?' })
  expect(dialog).toHaveTextContent('signs you out on all your devices')

  await user.click(screen.getAllByRole('button', { name: 'Sign out' }).at(-1)!)
  await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument())
  expect(tokenStore.get()).toBeNull()
})
