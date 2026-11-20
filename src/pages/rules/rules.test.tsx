import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { tokenStore } from '@/features/auth/tokenStore'
import type { RulesSummary, SplitRule } from '@/features/rules/api'
import { emptyPage, mockDashboard, newUserOnboarding, summary } from '@/test/fixtures'
import { apiUrl, renderRoute, server, setupMockApi } from '@/test/utils'

setupMockApi()

const verified = { ...newUserOnboarding, kycStatus: 'approved', progress: { ...newUserOnboarding.progress, kycCompleted: true, percent: 67 } }

const rulesSummary: RulesSummary = {
  baselineSalary: 85_000_000,
  totalAllocated: 61_250_000,
  allocatedPercent: 72,
  remainder: 23_750_000,
  remainderPercent: 28,
  overAllocated: false,
  activeRules: 2,
  toWallets: 40_000_000,
  toBeneficiaries: 21_250_000,
  segments: [
    { ruleId: 'r1', name: 'Mum', amount: 5_000_000, percent: 6 },
    { ruleId: 'r2', name: 'Rent', amount: 56_250_000, percent: 66 },
  ],
}

const rules: SplitRule[] = [
  { id: 'r2', name: 'Rent', priority: 5, destinationType: 'wallet', walletId: 'w1', destination: { id: 'w1', name: 'Rent wallet' }, method: 'fixed', value: 56_250_000, status: 'active', createdAt: '2026-11-02T10:00:00Z' },
  { id: 'r1', name: 'Mum', priority: 1, destinationType: 'beneficiary', beneficiaryId: 'b1', destination: { id: 'b1', name: 'Ada Obi' }, method: 'percentage', value: 12.5, status: 'active', createdAt: '2026-11-01T10:00:00Z' },
]

function mockRulesPage({ kyc = true, account = 'not_issued', balance = 0 } = {}) {
  mockDashboard(
    summary({
      onboarding: kyc ? verified : newUserOnboarding,
      salaryAccount: { ...summary().salaryAccount, status: account as 'active', balance },
    }),
  )
  server.use(
    http.get(apiUrl('/split-rules/summary'), () => HttpResponse.json(rulesSummary)),
    http.get(apiUrl('/split-rules'), () => HttpResponse.json({ data: rules, pagination: { total: 2, page: 1, limit: 10, pages: 1 } })),
    http.get(apiUrl('/split-runs'), () => HttpResponse.json(emptyPage)),
    http.get(apiUrl('/wallets'), () =>
      HttpResponse.json([{ id: 'w9', name: 'School fees', accentColor: 'green', balance: 0, currency: 'NGN' }]),
    ),
    http.get(apiUrl('/beneficiaries'), () => HttpResponse.json(emptyPage)),
  )
}

beforeEach(() => tokenStore.set('token', false))

test('a rule that would take more than the unallocated salary is blocked before anything is sent', async () => {
  let posted = false
  mockRulesPage()
  server.use(http.post(apiUrl('/split-rules'), () => ((posted = true), HttpResponse.json({}))))
  renderRoute('/split-rules?create=1')
  const user = userEvent.setup()

  const dialog = await screen.findByRole('dialog', { name: 'Create Split Rule' })
  await user.type(within(dialog).getByLabelText('Rule Name'), 'Holiday')
  await waitFor(() => expect(within(dialog).getByRole('option', { name: /School fees/ })).toBeInTheDocument())
  await user.selectOptions(within(dialog).getByLabelText('Select Wallet'), 'w9')
  await user.type(within(dialog).getByLabelText('Amount'), '300,000')

  expect(await within(dialog).findByText('This rule would over-allocate your salary')).toBeInTheDocument()
  expect(within(dialog).getByText(/You have ₦237,500.00 unallocated/)).toBeInTheDocument()
  expect(within(dialog).getByText(/₦62,500.00 too much/)).toBeInTheDocument()
  expect(within(dialog).getByRole('button', { name: 'Activate Split Rule' })).toBeDisabled()
  expect(posted).toBe(false)
})

test('a percentage rule previews its monthly amount and is sent as a percent, not kobo', async () => {
  let body: unknown
  mockRulesPage()
  server.use(
    http.post(apiUrl('/split-rules'), async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ rule: { ...rules[0], id: 'new' } }, { status: 201 })
    }),
  )
  renderRoute('/split-rules?create=1&destinationType=wallet&destinationId=w9')
  const user = userEvent.setup()

  const dialog = await screen.findByRole('dialog', { name: 'Create Split Rule' })
  await waitFor(() => expect(within(dialog).getByLabelText('Select Wallet')).toHaveValue('w9'))
  await user.type(within(dialog).getByLabelText('Rule Name'), 'Fees')
  await user.clear(within(dialog).getByLabelText('Priority'))
  await user.type(within(dialog).getByLabelText('Priority'), '3')
  await user.click(within(dialog).getByRole('radio', { name: 'Percentage (%)' }))
  await user.type(within(dialog).getByLabelText('Percentage of salary'), '12.5')

  expect(await within(dialog).findByText('₦106,250.00')).toBeInTheDocument()
  expect(within(dialog).getByText(/₦131,250.00 stays unallocated/)).toBeInTheDocument()

  await user.click(within(dialog).getByRole('button', { name: 'Activate Split Rule' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(body).toEqual({ name: 'Fees', priority: 3, destinationType: 'wallet', walletId: 'w9', method: 'percentage', value: 12.5, status: 'active' })
})

test('a destination that already has a rule is flagged on the destination field', async () => {
  mockRulesPage()
  server.use(
    http.post(apiUrl('/split-rules'), () =>
      HttpResponse.json({ message: 'Has rule', code: 'DESTINATION_HAS_RULE', statusCode: 409 }, { status: 409 }),
    ),
  )
  renderRoute('/split-rules?create=1&destinationType=wallet&destinationId=w9')
  const user = userEvent.setup()

  const dialog = await screen.findByRole('dialog', { name: 'Create Split Rule' })
  await waitFor(() => expect(within(dialog).getByLabelText('Select Wallet')).toHaveValue('w9'))
  await user.type(within(dialog).getByLabelText('Rule Name'), 'Again')
  await user.type(within(dialog).getByLabelText('Amount'), '1,000')
  await user.click(within(dialog).getByRole('button', { name: 'Activate Split Rule' }))

  expect(await within(dialog).findByText('This destination already has a rule. Edit that rule instead.')).toBeInTheDocument()
})

test('before identity verification, rule creation explains it is locked instead of showing a form the API will refuse', async () => {
  mockRulesPage({ kyc: false })
  renderRoute('/split-rules?create=1')

  const dialog = await screen.findByRole('dialog', { name: 'Create Split Rule' })
  expect(await within(dialog).findByText('Split rules unlock after identity verification')).toBeInTheDocument()
  expect(within(dialog).getByRole('link', { name: 'Verify your identity' })).toHaveAttribute('href', '/verify-identity')
  expect(within(dialog).queryByLabelText('Rule Name')).not.toBeInTheDocument()
})

test('Run Now is unavailable, with a reason, until the salary account is active', async () => {
  mockRulesPage({ account: 'not_issued' })
  renderRoute('/split-rules')
  const button = await screen.findByRole('button', { name: 'Run Now' })
  await waitFor(() => expect(button).toBeDisabled())
  expect(button).toHaveAccessibleDescription('Run Now is available once your salary account is active.')
})

test('Run Now reviews rules in priority order, then shows what ran and what was skipped', async () => {
  mockRulesPage({ account: 'active', balance: 60_000_000 })
  server.use(
    http.post(apiUrl('/split-runs'), () =>
      HttpResponse.json({
        id: 'run1',
        status: 'partially_completed',
        trigger: 'manual',
        createdAt: '2026-11-19T09:00:00Z',
        salaryAmount: 60_000_000,
        toWallets: 0,
        toBeneficiaries: 7_500_000,
        remaining: 52_500_000,
        skipped: [{ ruleName: 'Rent', reason: 'insufficient_funds', requested: 56_250_000, available: 52_500_000 }],
      }),
    ),
  )
  renderRoute('/split-rules')
  const user = userEvent.setup()

  const button = await screen.findByRole('button', { name: 'Run Now' })
  await waitFor(() => expect(button).toBeEnabled())
  await user.click(button)

  const dialog = await screen.findByRole('dialog', { name: 'Run Now' })
  const order = await within(dialog).findByRole('list', { name: 'Rules in the order they will run' })
  expect(within(order).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
    expect.stringContaining('Mum'),
    expect.stringContaining('Rent'),
  ])
  expect(within(dialog).getByText('A rule that does not fully fit is skipped, never paid in part.')).toBeInTheDocument()

  await user.click(within(dialog).getByRole('button', { name: 'Run split now' }))
  expect(await within(dialog).findByText('Partially completed')).toBeInTheDocument()
  expect(within(dialog).getByText(/Needed ₦562,500.00, ₦525,000.00 was left/)).toBeInTheDocument()
})

test('pausing a rule sends the new status', async () => {
  let patched: unknown
  mockRulesPage()
  server.use(
    http.patch(apiUrl('/split-rules/r1'), async ({ request }) => {
      patched = await request.json()
      return HttpResponse.json({ ...rules[1], status: 'paused' })
    }),
  )
  renderRoute('/split-rules')
  const user = userEvent.setup()

  await user.click(await screen.findByRole('button', { name: 'Pause Mum' }))
  await waitFor(() => expect(patched).toEqual({ status: 'paused' }))
})

test('the beneficiary picker loads up to 100 beneficiaries, not just the first page of 10', async () => {
  let limit: string | null = null
  mockRulesPage()
  server.use(
    http.get(apiUrl('/beneficiaries'), ({ request }) => {
      limit = new URL(request.url).searchParams.get('limit')
      return HttpResponse.json(emptyPage)
    }),
  )
  renderRoute('/split-rules?create=1')
  await screen.findByRole('dialog', { name: 'Create Split Rule' })
  await waitFor(() => expect(limit).toBe('100'))
})
