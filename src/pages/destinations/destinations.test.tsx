import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { tokenStore } from '@/features/auth/tokenStore'
import type { WalletDetail } from '@/features/wallets/api'
import { emptyPage, mockDashboard, newUserOnboarding, summary } from '@/test/fixtures'
import { apiUrl, renderRoute, server, setupMockApi } from '@/test/utils'

setupMockApi()

const categories = [
  { id: 'cat-savings', name: 'Savings', slug: 'savings' },
  { id: 'cat-family', name: 'Family Support', slug: 'family-support' },
]

const wallet: WalletDetail = {
  id: 'w1',
  name: 'Rent',
  accentColor: 'blue',
  accentHex: '#4BA3F2',
  balance: 5_000_000,
  currency: 'NGN',
  targetAmount: 150_000_000,
  progressPercent: 3,
  category: categories[0]!,
  createdAt: '2026-11-18T23:30:00Z',
  stats: { availableBalance: 5_000_000, totalAllocated: 5_000_000, totalMovedBack: 0 },
  linkedRule: null,
}

beforeEach(() => {
  tokenStore.set('token', false)
  mockDashboard(summary())
  server.use(
    http.get(apiUrl('/categories'), () => HttpResponse.json(categories)),
    http.get(apiUrl('/wallets/activity'), () => HttpResponse.json(emptyPage)),
    http.get(apiUrl('/wallets/accent-colors'), () =>
      HttpResponse.json([
        { key: 'green', hex: '#22A447' },
        { key: 'purple', hex: '#8B3DF5' },
      ]),
    ),
  )
})

describe('wallets', () => {
  test('creating a wallet sends the target in kobo and can go straight to rule creation', async () => {
    let body: unknown
    server.use(
      http.post(apiUrl('/wallets'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...wallet, id: 'new-wallet' }, { status: 201 })
      }),
    )
    const { router } = renderRoute('/destinations?tab=wallets&create=wallet')
    const user = userEvent.setup()

    const dialog = await screen.findByRole('dialog', { name: 'Create New Wallet' })
    await user.type(within(dialog).getByLabelText('Wallet Name'), 'Rent')
    await waitFor(() => expect(within(dialog).getByRole('option', { name: 'Savings' })).toBeInTheDocument())
    await user.selectOptions(within(dialog).getByLabelText('Select Category'), 'cat-savings')
    await user.type(within(dialog).getByLabelText('Target Amount'), '1,500,000')
    await user.click(within(dialog).getByRole('radio', { name: 'Purple' }))
    await user.click(within(dialog).getByRole('button', { name: 'Save and create rule' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/split-rules'))
    expect(router.state.location.search).toContain('destinationType=wallet&destinationId=new-wallet')
    expect(body).toEqual({ name: 'Rent', categoryId: 'cat-savings', accentColor: 'purple', targetAmount: 150_000_000 })
  })

  test('"No target amount" sends null, and a taken name is flagged on the name field', async () => {
    let body: unknown
    server.use(
      http.post(apiUrl('/wallets'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ message: 'Taken', code: 'WALLET_NAME_TAKEN', statusCode: 409 }, { status: 409 })
      }),
    )
    renderRoute('/destinations?tab=wallets&create=wallet')
    const user = userEvent.setup()

    const dialog = await screen.findByRole('dialog', { name: 'Create New Wallet' })
    await user.type(within(dialog).getByLabelText('Wallet Name'), 'Rent')
    await waitFor(() => expect(within(dialog).getByRole('option', { name: 'Savings' })).toBeInTheDocument())
    await user.selectOptions(within(dialog).getByLabelText('Select Category'), 'cat-savings')
    await user.click(within(dialog).getByLabelText('No target amount'))
    expect(within(dialog).getByLabelText('Target Amount')).toBeDisabled()
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await within(dialog).findByText('You already have a wallet with this name.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Wallet Name')).toHaveFocus()
    expect(body).toMatchObject({ targetAmount: null })
  })

  test('moving money back checks the balance first, then confirms the exact amount', async () => {
    let moved: unknown
    server.use(
      http.get(apiUrl('/wallets/w1'), () => HttpResponse.json(wallet)),
      http.get(apiUrl('/wallets/w1/transactions'), () => HttpResponse.json(emptyPage)),
      http.post(apiUrl('/wallets/w1/move'), async ({ request }) => {
        moved = await request.json()
        return HttpResponse.json({})
      }),
    )
    renderRoute('/destinations/wallets/w1')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Move' }))
    const dialog = await screen.findByRole('dialog', { name: 'Move to Salary Account' })
    await user.type(within(dialog).getByLabelText('Amount'), '50,000.01')
    await user.click(within(dialog).getByRole('button', { name: 'Review' }))
    expect(await within(dialog).findByText('The most you can enter is ₦50,000.00.')).toBeInTheDocument()
    expect(moved).toBeUndefined()

    await user.clear(within(dialog).getByLabelText('Amount'))
    await user.type(within(dialog).getByLabelText('Amount'), '20,000')
    await user.click(within(dialog).getByRole('button', { name: 'Review' }))
    expect(within(dialog).getByText('₦20,000.00')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Confirm move' }))

    expect(await within(dialog).findByText('Money moved')).toBeInTheDocument()
    expect(moved).toEqual({ amount: 2_000_000 })
  })

  test('a wallet that still holds money cannot be deleted, and the reason is explained', async () => {
    let deleted = false
    server.use(
      http.get(apiUrl('/wallets/w1'), () => HttpResponse.json(wallet)),
      http.get(apiUrl('/wallets/w1/transactions'), () => HttpResponse.json(emptyPage)),
      http.delete(apiUrl('/wallets/w1'), () => ((deleted = true), HttpResponse.json({}))),
    )
    renderRoute('/destinations/wallets/w1')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete Rent?' })
    expect(dialog).toHaveTextContent('This wallet still holds money')
    expect(within(dialog).queryByRole('button', { name: 'Delete wallet' })).not.toBeInTheDocument()
    expect(deleted).toBe(false)
  })
})

describe('beneficiaries', () => {
  const banks = [
    { code: '058', name: 'GTBank' },
    { code: '044', name: 'Access Bank' },
  ]

  test('the account name is looked up after 10 digits and saving waits for it', async () => {
    let body: unknown
    server.use(
      http.get(apiUrl('/banks'), () => HttpResponse.json(banks)),
      http.post(apiUrl('/beneficiaries/resolve'), () =>
        HttpResponse.json({ bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789', accountName: 'ADA OBI' }),
      ),
      http.get(apiUrl('/beneficiaries'), () => HttpResponse.json(emptyPage)),
      http.post(apiUrl('/beneficiaries'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: 'b1', accountName: 'ADA OBI', bankName: 'GTBank', status: 'active' }, { status: 201 })
      }),
    )
    renderRoute('/destinations?tab=beneficiaries&create=beneficiary')
    const user = userEvent.setup()

    const dialog = await screen.findByRole('dialog', { name: 'Add Recipient/Beneficiary' })
    await waitFor(() => expect(within(dialog).getByRole('option', { name: 'GTBank' })).toBeInTheDocument())
    await user.selectOptions(within(dialog).getByLabelText('Bank Name'), '058')
    await user.type(within(dialog).getByLabelText('Account Number (10 digits)'), '01234abc56789')
    expect(within(dialog).getByLabelText('Account Number (10 digits)')).toHaveValue('0123456789')
    expect(await within(dialog).findByText('ADA OBI')).toBeInTheDocument()

    await waitFor(() => expect(within(dialog).getByRole('option', { name: 'Family Support' })).toBeInTheDocument())
    await user.selectOptions(within(dialog).getByLabelText('Select Category'), 'cat-family')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(body).toEqual({ bankCode: '058', accountNumber: '0123456789', categoryId: 'cat-family' })
  })

  test('an account the bank cannot find blocks saving with a clear message', async () => {
    server.use(
      http.get(apiUrl('/banks'), () => HttpResponse.json(banks)),
      http.post(apiUrl('/beneficiaries/resolve'), () =>
        HttpResponse.json({ message: 'Not found', code: 'ACCOUNT_NOT_FOUND', statusCode: 422 }, { status: 422 }),
      ),
      http.get(apiUrl('/beneficiaries'), () => HttpResponse.json(emptyPage)),
    )
    renderRoute('/destinations?tab=beneficiaries&create=beneficiary')
    const user = userEvent.setup()

    const dialog = await screen.findByRole('dialog', { name: 'Add Recipient/Beneficiary' })
    await waitFor(() => expect(within(dialog).getByRole('option', { name: 'GTBank' })).toBeInTheDocument())
    await user.selectOptions(within(dialog).getByLabelText('Bank Name'), '058')
    await user.type(within(dialog).getByLabelText('Account Number (10 digits)'), '0123456789')

    expect(await within(dialog).findByText('We could not find an account with that number at this bank.')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})

describe('setup wizard', () => {
  test('resumes at the first unfinished step and saves income in kobo', async () => {
    let body: unknown
    const withWallet = { ...newUserOnboarding, setupChecklist: { ...newUserOnboarding.setupChecklist, hasWallet: true } }
    server.use(
      http.get(apiUrl('/setup/progress'), () => HttpResponse.json({ onboarding: withWallet })),
      http.get(apiUrl('/setup/income'), () => HttpResponse.json({ income: null })),
      http.put(apiUrl('/setup/income'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ income: body, onboarding: withWallet })
      }),
    )
    renderRoute('/setup')
    const user = userEvent.setup()

    const steps = await screen.findByRole('list', { name: 'Setup steps' })
    expect(within(steps).getByText('Income').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(within(steps).getByText('Wallets').closest('li')).toHaveTextContent('done')

    await user.type(await screen.findByLabelText('Employer'), 'Talent Nation')
    await user.type(screen.getByLabelText('Monthly Salary Amount'), '850,000')
    await user.selectOptions(screen.getByLabelText('Expected Payday (Day of Month)'), '31')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(within(steps).getByText('Wallets').closest('li')).toHaveAttribute('aria-current', 'step'))
    expect(body).toEqual({ employerName: 'Talent Nation', monthlyAmount: 85_000_000, paydayDay: 31 })
  })
})
