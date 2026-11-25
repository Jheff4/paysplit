import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { Transaction } from '@/api/types'
import { tokenStore } from '@/features/auth/tokenStore'
import type { Profile } from '@/features/settings/api'
import { emptyPage, mockDashboard, newUserOnboarding, summary } from '@/test/fixtures'
import { apiUrl, renderRoute, server, setupMockApi } from '@/test/utils'

setupMockApi()

const tx: Transaction = {
  id: 't1',
  reference: 'PAY-20261119-0001',
  type: 'wallet_allocation',
  status: 'pending',
  title: 'Rent Wallet',
  direction: 'out',
  amount: 15_000_000,
  signedAmount: -15_000_000,
  fee: 0,
  currency: 'NGN',
  category: { id: 'c1', name: 'Rent & Housing', slug: 'rent-housing' },
  destination: { type: 'wallet', id: 'w1', name: 'Rent' },
  narration: 'Rent',
  createdAt: '2026-11-18T23:30:00Z',
  completedAt: null,
}

beforeEach(() => {
  tokenStore.set('token', false)
  mockDashboard(summary())
})

describe('transactions', () => {
  test('filters are sent to the API as Lagos calendar dates, and an impossible range is explained, not sent', async () => {
    const seen: URLSearchParams[] = []
    server.use(
      http.get(apiUrl('/transactions'), ({ request }) => {
        seen.push(new URL(request.url).searchParams)
        return HttpResponse.json({ data: [tx], pagination: { total: 1, page: 1, limit: 10, pages: 1 } })
      }),
    )
    renderRoute('/transactions')
    const user = userEvent.setup()

    expect((await screen.findAllByText('Rent Wallet')).length).toBeGreaterThan(0)
    expect(screen.getByText('Rent & Housing')).toBeInTheDocument()
    expect(screen.getAllByText('19 Nov 2026, 12:30 am').length).toBeGreaterThan(0)
    expect(screen.getAllByText('-₦150,000.00').length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText('Status'), 'success')
    await user.type(screen.getByLabelText('From'), '2026-11-01')
    await user.type(screen.getByLabelText('To'), '2026-11-15')
    await waitFor(() => expect(seen.at(-1)?.get('to')).toBe('2026-11-15'))
    expect(seen.at(-1)?.get('from')).toBe('2026-11-01')
    expect(seen.at(-1)?.get('status')).toBe('success')

    await user.clear(screen.getByLabelText('From'))
    await user.type(screen.getByLabelText('From'), '2026-11-16')
    expect(await screen.findByRole('alert')).toHaveTextContent('The start date must be on or before the end date.')
    await waitFor(() => expect(seen.at(-1)?.get('from')).toBeNull())
  })

  test('the statement export uses the same filters and downloads a CSV', async () => {
    let exportParams: URLSearchParams | undefined
    const createUrl = vi.fn(() => 'blob:statement')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() }))
    server.use(
      http.get(apiUrl('/transactions'), () => HttpResponse.json(emptyPage)),
      http.get(apiUrl('/transactions/export'), ({ request }) => {
        exportParams = new URL(request.url).searchParams
        return new HttpResponse('reference,amount\nPAY-1,1500.00\n', { headers: { 'Content-Type': 'text/csv' } })
      }),
    )
    renderRoute('/transactions')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('radio', { name: 'Beneficiary' }))
    await user.click(screen.getByRole('button', { name: 'Export Statement CSV' }))

    expect(await screen.findByText(/Statement downloaded/)).toBeInTheDocument()
    expect(exportParams?.get('type')).toBe('beneficiary')
    expect(createUrl).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  test('a pending transfer is never shown as failed or final', async () => {
    server.use(
      http.get(apiUrl('/transactions'), () => HttpResponse.json(emptyPage)),
      http.get(apiUrl('/transactions/t1'), () => HttpResponse.json({ ...tx, providerReference: 'PRV-998' })),
    )
    renderRoute('/transactions/t1')

    const sheet = await screen.findByRole('dialog', { name: 'Transaction Details' })
    expect(await within(sheet).findByText('₦150,000')).toBeInTheDocument()
    expect(within(sheet).getByText('Not final yet')).toBeInTheDocument()
    expect(within(sheet).getByText(/Please do not treat it as failed/)).toBeInTheDocument()
    expect(within(sheet).getByText('PRV-998')).toBeInTheDocument()
    expect(within(sheet).getByText('Destination Type').nextSibling).toHaveTextContent('Wallet')
    expect(within(sheet).getByText('Category').nextSibling).toHaveTextContent('Rent & Housing')
  })
})

describe('settings', () => {
  const profile: Profile = {
    user: {
      id: 'u1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Obi',
      phoneNumber: '+2348034567890',
      countryCode: 'NG',
      profileImageUrl: null,
      kycStatus: 'approved',
    },
    accountId: 'USER0842196',
    memberSince: '2026-11-18T23:30:00Z',
    tier: 2,
    namesLocked: true,
    salaryAccount: summary().salaryAccount,
    income: null,
    security: { passwordLastUpdated: '2026-11-18T10:00:00Z' },
    notificationPreferences: {
      preferences: {
        push: { salaryReceived: true, splitCompleted: true, transferUpdates: true, accountUpdates: true },
        sms: { salaryReceived: false, splitCompleted: false, transferUpdates: false, accountUpdates: false },
        email: { salaryReceived: true, splitCompleted: true, transferUpdates: true, accountUpdates: true },
      },
      topics: {
        salaryReceived: 'When your salary arrives',
        splitCompleted: 'When a split finishes',
        transferUpdates: 'When a transfer succeeds or fails',
        accountUpdates: 'Changes to your account',
      },
      deliveredChannels: ['email'],
    },
    onboarding: newUserOnboarding,
  }

  beforeEach(() => {
    server.use(
      http.get(apiUrl('/users/me/profile'), () => HttpResponse.json(profile)),
      http.get(apiUrl('/wallets'), () => HttpResponse.json([])),
    )
  })

  describe('salary account that needs a BVN or NIN', () => {
    const needsId = { ...profile, salaryAccount: { ...profile.salaryAccount, status: 'failed' as const, actionRequired: 'add_bvn_or_nin' } }

    test('checks the number before sending, sends the chosen method, then shows the account is being opened', async () => {
      let sent: unknown
      server.use(
        http.get(apiUrl('/users/me/profile'), () => HttpResponse.json(needsId)),
        http.post(apiUrl('/salary-account/identity'), async ({ request }) => {
          sent = await request.json()
          return HttpResponse.json({ ...needsId.salaryAccount, status: 'pending', actionRequired: null })
        }),
      )
      renderRoute('/settings')
      const user = userEvent.setup()

      const panel = (await screen.findByRole('heading', { name: 'Account Details' })).closest('section')!
      expect(within(panel).queryByRole('link', { name: 'Verify your identity' })).not.toBeInTheDocument()
      await user.click(within(panel).getByRole('radio', { name: 'National ID (NIN)' }))
      await user.type(within(panel).getByLabelText('National Identification Number (NIN)'), '7012345')
      await user.click(within(panel).getByRole('button', { name: 'Add and open my account' }))
      expect(await within(panel).findByText('Your NIN is 11 digits.')).toBeInTheDocument()
      expect(sent).toBeUndefined()

      await user.type(within(panel).getByLabelText('National Identification Number (NIN)'), '6789')
      await user.click(within(panel).getByRole('button', { name: 'Add and open my account' }))
      expect(await within(panel).findByText(/Your salary account is being opened/)).toBeInTheDocument()
      expect(sent).toEqual({ method: 'nin', idNumber: '70123456789' })
    })

    test('a name that does not match the verified identity is explained', async () => {
      server.use(
        http.get(apiUrl('/users/me/profile'), () => HttpResponse.json(needsId)),
        http.post(apiUrl('/salary-account/identity'), () =>
          HttpResponse.json({ statusCode: 422, code: 'NAME_MISMATCH', message: 'Name mismatch' }, { status: 422 }),
        ),
      )
      renderRoute('/settings')
      const user = userEvent.setup()

      const panel = (await screen.findByRole('heading', { name: 'Account Details' })).closest('section')!
      await user.type(within(panel).getByLabelText('Bank Verification Number (BVN)'), '22222222222')
      await user.click(within(panel).getByRole('button', { name: 'Add and open my account' }))
      expect(await within(panel).findByText('The name on this record does not match your PaySplit name.')).toBeInTheDocument()
    })
  })

  test('verified names are locked and say why; email is read-only', async () => {
    renderRoute('/settings')
    const first = await screen.findByLabelText('First name')
    expect(first).toBeDisabled()
    expect(first).toHaveAccessibleDescription('Locked because your identity is verified.')
    expect(screen.getByLabelText('Email address')).toHaveAttribute('readonly')
    expect(screen.getByText('Member since:').nextElementSibling).toHaveTextContent('19 Nov 2026')
  })

  test('a notification toggle that fails to save is put back and explained', async () => {
    server.use(
      http.put(apiUrl('/users/me/notification-preferences'), () => HttpResponse.json({ statusCode: 500 }, { status: 500 })),
    )
    renderRoute('/settings')
    const user = userEvent.setup()

    const toggle = await screen.findByRole('switch', { name: 'When your salary arrives' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await user.click(toggle)

    expect(await screen.findByText(/We could not save that change, so we put it back/)).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'When your salary arrives' })).toHaveAttribute('aria-checked', 'true')
  })

  test('SMS settings are honest that only email is delivered today', async () => {
    renderRoute('/settings')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('radio', { name: 'SMS Alerts' }))
    expect(screen.getByText(/PaySplit only sends email today/)).toBeInTheDocument()
  })

  test('a wrong current password is flagged on that field, and a change keeps you signed in with the new token', async () => {
    let attempt = 0
    server.use(
      http.post(apiUrl('/auth/password/change'), () => {
        attempt += 1
        return attempt === 1
          ? HttpResponse.json({ message: 'Wrong', code: 'INVALID_CURRENT_PASSWORD', statusCode: 401 }, { status: 401 })
          : HttpResponse.json({ accessToken: 'fresh-token' })
      }),
    )
    renderRoute('/settings')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Change password' }))
    const dialog = await screen.findByRole('dialog', { name: 'Change password' })
    await user.type(within(dialog).getByLabelText('Current password'), 'Wrong!pass1')
    await user.type(within(dialog).getByLabelText('New password'), 'N3w!password')
    await user.type(within(dialog).getByLabelText('Confirm new password'), 'N3w!password')
    await user.click(within(dialog).getByRole('button', { name: 'Change password' }))

    expect(await within(dialog).findByText('Your current password is incorrect.')).toBeInTheDocument()
    expect(tokenStore.get()).toBe('token')

    await user.clear(within(dialog).getByLabelText('Current password'))
    await user.type(within(dialog).getByLabelText('Current password'), 'Right!pass1')
    await user.click(within(dialog).getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText(/Your password is changed/)).toBeInTheDocument()
    expect(tokenStore.get()).toBe('fresh-token')
  })
})

describe('loading', () => {
  test('while transactions load, a placeholder is announced to screen readers, then replaced by the rows', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(apiUrl('/transactions'), async () => {
        await gate
        return HttpResponse.json({ data: [tx], pagination: { total: 1, page: 1, limit: 10, pages: 1 } })
      }),
    )
    renderRoute('/transactions')

    expect(await screen.findByText('Loading your transactions')).toBeInTheDocument()
    expect(screen.queryByText('Rent Wallet')).not.toBeInTheDocument()

    release()
    expect((await screen.findAllByText('Rent Wallet')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Loading your transactions')).not.toBeInTheDocument()
  })

  test('pointing at the Transactions link starts loading its data before the click', async () => {
    const requested = vi.fn()
    server.use(
      http.get(apiUrl('/transactions'), ({ request }) => {
        if (new URL(request.url).searchParams.has('page')) requested()
        return HttpResponse.json(emptyPage)
      }),
    )
    renderRoute('/')
    const user = userEvent.setup()
    const link = await screen.findByRole('link', { name: 'Transactions' })
    expect(requested).not.toHaveBeenCalled()

    await user.hover(link)
    await waitFor(() => expect(requested).toHaveBeenCalledTimes(1))
  })
})
