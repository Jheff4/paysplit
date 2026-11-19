import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { api } from './api/client'
import { queryClient } from './api/queryClient'
import { tokenStore } from './features/auth/tokenStore'
import { emptyPage, mockDashboard, summary } from './test/fixtures'
import { apiUrl, renderRoute, server, setupMockApi } from './test/utils'

setupMockApi()

test('a signed-out visitor to a private page is sent to sign in, keeping where they were going', async () => {
  const { router } = renderRoute('/destinations?tab=wallets')
  expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back!' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/sign-in')
  expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/destinations?tab=wallets')}`)
})

test('a signed-in user sees the app with navigation', async () => {
  tokenStore.set('token', false)
  mockDashboard(summary())
  renderRoute('/')
  expect(await screen.findByRole('heading', { level: 1, name: /, Ada!$/ })).toBeInTheDocument()
  expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0)
  expect(screen.getAllByRole('link', { name: 'Dashboard' })[0]).toHaveAttribute('aria-current', 'page')
})

test('an expired session anywhere returns the user to sign in and wipes cached data', async () => {
  tokenStore.set('token', false)
  server.use(
    http.get(apiUrl('/notifications'), () => HttpResponse.json({ ...emptyPage, unreadCount: 0 })),
    http.get(apiUrl('/transactions'), () => HttpResponse.json(emptyPage)),
    http.get(apiUrl('/dashboard/summary'), () => HttpResponse.json(summary())),
    http.get(apiUrl('/auth/me'), () => HttpResponse.json({ statusCode: 401 }, { status: 401 })),
  )
  queryClient.setQueryData(['private'], { balance: 1 })
  renderRoute('/transactions')
  await screen.findByRole('heading', { level: 1, name: 'Transactions' })

  await api('/auth/me').catch(() => undefined)

  expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back!' })).toBeInTheDocument()
  expect(screen.getByText('Your session ended. Please sign in again.')).toBeInTheDocument()
  expect(queryClient.getQueryData(['private'])).toBeUndefined()
})

test('sign out asks for confirmation and explains it signs out every device', async () => {
  tokenStore.set('token', false)
  let loggedOut = false
  mockDashboard(summary())
  server.use(http.post(apiUrl('/auth/logout'), () => ((loggedOut = true), HttpResponse.json({}))))
  renderRoute('/')
  const user = userEvent.setup()

  await user.click(await screen.findByRole('button', { name: 'Account menu' }))
  await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Sign out of PaySplit?' })
  expect(dialog).toHaveTextContent('signs you out on all your devices')

  await user.click(within(dialog).getByRole('button', { name: 'Sign out' }))
  await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Welcome back!' })).toBeInTheDocument())
  expect(tokenStore.get()).toBeNull()
  expect(loggedOut).toBe(true)
})
