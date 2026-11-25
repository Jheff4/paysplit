import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { tokenStore } from '@/features/auth/tokenStore'
import { emptyPage, mockDashboard, newUserOnboarding, summary } from '@/test/fixtures'
import { apiUrl, renderRoute, server, setupMockApi } from '@/test/utils'

setupMockApi()

beforeEach(() => tokenStore.set('token', false))

test('a brand-new user sees onboarding prompts and honest empty states', async () => {
  mockDashboard(summary())
  renderRoute('/')
  const user = userEvent.setup()

  expect(await screen.findByRole('heading', { name: 'Complete Onboarding' })).toBeInTheDocument()
  expect(screen.getByText(/No salary account yet/)).toBeInTheDocument()
  expect(screen.getByText('No split rule yet')).toBeInTheDocument()
  expect(await screen.findByText('No activity yet')).toBeInTheDocument()
  expect(await screen.findByText('No wallet yet')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, Ada!$/)

  await user.click(screen.getByRole('button', { name: /Complete Onboarding/ }))
  const dialog = await screen.findByRole('dialog', { name: 'Complete your account setup' })
  expect(within(dialog).getByRole('img', { name: '34% complete' })).toBeInTheDocument()
  expect(within(dialog).getByText('Done')).toBeInTheDocument()
  expect(within(dialog).getByRole('link', { name: 'Start Complete KYC' })).toHaveAttribute('href', '/verify-identity')
})

test('an active salary account shows the balance in its currency and its details on request', async () => {
  mockDashboard(
    summary({
      salaryAccount: {
        status: 'active',
        accountNumber: '1029384756',
        maskedAccountNumber: '*****4756',
        bankName: 'Providus Bank',
        accounts: [],
        actionRequired: null,
        balance: 85_000_000,
        currency: 'NGN',
        accountName: 'Ada Obi',
      },
      onboarding: { ...newUserOnboarding, progress: { ...newUserOnboarding.progress, kycCompleted: true, setupCompleted: true, percent: 100 } },
    }),
  )
  renderRoute('/')
  const user = userEvent.setup()

  expect(await screen.findByText('₦850,000')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Complete Onboarding' })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Hide balance' }))
  expect(screen.queryByText('₦850,000')).not.toBeInTheDocument()
  expect(screen.getByText('Balance hidden')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'View Account Details' }))
  const dialog = await screen.findByRole('dialog', { name: 'Salary account details' })
  expect(within(dialog).getByText('1029384756')).toBeInTheDocument()
  expect(within(dialog).getByText('Providus Bank')).toBeInTheDocument()
  expect(within(dialog).getByRole('button', { name: 'Copy account number' })).toBeInTheDocument()
})

test('a salary account that needs an ID says so instead of showing a balance as if all is well', async () => {
  mockDashboard(
    summary({
      salaryAccount: { ...summary().salaryAccount, status: 'failed', actionRequired: 'add_bvn_or_nin' },
    }),
  )
  renderRoute('/')
  expect(await screen.findByText(/needs a BVN or NIN before it can be opened/)).toBeInTheDocument()
})

test('a dashboard that fails to load offers a retry', async () => {
  server.use(
    http.get(apiUrl('/dashboard/summary'), () => HttpResponse.json({ statusCode: 500 }, { status: 500 })),
    http.get(apiUrl('/notifications'), () => HttpResponse.json({ ...emptyPage, unreadCount: 0 })),
  )
  renderRoute('/')
  expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('We could not load your dashboard')
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
})

test('notifications can be marked read and the bell shows the unread count', async () => {
  let markedAll = false
  const item = { id: 'n1', title: 'Salary received', body: 'We received your salary.', createdAt: '2026-11-18T23:30:00Z', readAt: null }
  server.use(
    http.get(apiUrl('/notifications'), () =>
      HttpResponse.json(
        markedAll
          ? { data: [{ ...item, readAt: '2026-11-19T08:00:00Z' }], pagination: { total: 1, page: 1, limit: 10, pages: 1 }, unreadCount: 0 }
          : { data: [item], pagination: { total: 1, page: 1, limit: 10, pages: 1 }, unreadCount: 1 },
      ),
    ),
    http.post(apiUrl('/notifications/read-all'), () => ((markedAll = true), HttpResponse.json({}))),
  )
  renderRoute('/notifications')
  const user = userEvent.setup()

  expect(await screen.findByRole('link', { name: 'Notifications, 1 unread' })).toBeInTheDocument()
  expect(await screen.findByText('Salary received')).toBeInTheDocument()
  expect(screen.getByText('19 Nov 2026, 12:30 am')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /Mark all as read/ }))
  expect(await screen.findByRole('link', { name: 'Notifications' })).toBeInTheDocument()
  expect(screen.queryByText('Unread:')).not.toBeInTheDocument()
})

describe('simulated salary payment (sandbox)', () => {
  const active = (income = true) =>
    summary({
      salaryAccount: { ...summary().salaryAccount, status: 'active', accountNumber: '0123456789', maskedAccountNumber: '****6789', balance: 0 },
      income: income ? { employerName: 'Acme Ltd', monthlyAmount: 85_000_000, paydayDay: 25 } : null,
    })
  const splitRun = {
    id: 'run1',
    trigger: 'auto',
    status: 'completed',
    baseAmount: 85_000_000,
    availableAmount: 85_000_000,
    toWallets: 28_500_000,
    toBeneficiaries: 0,
    fees: 0,
    skipped: [],
    creditTransactionId: 't1',
    createdAt: '2026-11-21T09:58:00Z',
    completedAt: '2026-11-21T09:58:02Z',
    transactions: [],
  }

  test('sends the expected salary in kobo and shows the split it triggered', async () => {
    mockDashboard(active())
    let sent: unknown
    server.use(
      http.post(apiUrl('/salary-account/simulate-credit'), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ transaction: { id: 't1' }, autoSplit: true, splitRun }, { status: 201 })
      }),
    )
    renderRoute('/')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Simulate salary payment/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Simulate salary payment' })
    expect(within(dialog).getByLabelText('Amount')).toHaveValue('850000.00')

    await user.click(within(dialog).getByRole('button', { name: 'Send test salary' }))
    expect(await within(dialog).findByText(/₦850,000.00 arrived in your salary account/)).toBeInTheDocument()
    expect(sent).toEqual({ amount: 85_000_000, senderName: 'Acme Ltd' })
    expect(within(dialog).getByText('To wallets').nextSibling).toHaveTextContent('₦285,000.00')
  })

  test('a payment that is not split automatically says why and points to Run Now', async () => {
    mockDashboard(active())
    server.use(
      http.post(apiUrl('/salary-account/simulate-credit'), () =>
        HttpResponse.json({ transaction: { id: 't2' }, autoSplit: false, splitRun: null }, { status: 201 }),
      ),
    )
    renderRoute('/')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Simulate salary payment/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Simulate salary payment' })
    await user.clear(within(dialog).getByLabelText('Amount'))
    await user.type(within(dialog).getByLabelText('Amount'), '100,000')
    await user.click(within(dialog).getByRole('button', { name: 'Send test salary' }))

    expect(await within(dialog).findByText(/It was not split automatically/)).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: /Run Now/ })).toHaveAttribute('href', '/split-rules')
  })

  test('before verification there is no salary account, so no simulation is offered', async () => {
    mockDashboard(summary())
    renderRoute('/')
    expect(await screen.findByText(/No salary account yet/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Simulate salary payment/ })).not.toBeInTheDocument()
  })
})
