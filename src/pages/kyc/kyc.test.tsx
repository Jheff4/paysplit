import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { KycStatus } from '@/features/kyc/api'
import { tokenStore } from '@/features/auth/tokenStore'
import { apiUrl, renderRoute, server, setupMockApi } from '@/test/utils'

setupMockApi()

const countries = [
  { code: 'NG', name: 'Nigeria', dialCode: '+234', currency: 'NGN', region: 'nigeria', methods: ['bvn', 'nin'] },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', currency: 'GBP', region: 'international', methods: ['passport', 'drivers_license'] },
]

function kycStatus(overrides: Partial<{ currentStep: string; kycStatus: string; profile: Partial<KycStatus['steps']['profile']>; identity: Partial<KycStatus['steps']['identity']>; liveness: Partial<KycStatus['steps']['liveness']> }> = {}): KycStatus {
  return {
    kycStatus: overrides.kycStatus ?? 'not_started',
    currentStep: overrides.currentStep ?? 'profile',
    steps: {
      profile: { completed: false, countryCode: null, phoneNumber: null, currencyCode: null, ...overrides.profile },
      identity: { status: 'not_started', region: null, method: null, maskedIdNumber: null, failureReason: null, attemptsRemaining: 3, retryAvailableAt: null, ...overrides.identity },
      liveness: { status: 'not_started', failureReason: null, attemptsRemaining: 3, retryAvailableAt: null, ...overrides.liveness },
    },
  }
}

beforeEach(() => {
  tokenStore.set('token', false)
  server.use(http.get(apiUrl('/kyc/countries'), () => HttpResponse.json(countries)))
})

test('profile step sends the phone in international format and moves to identity', async () => {
  let current = kycStatus()
  let body: unknown
  server.use(
    http.get(apiUrl('/kyc/status'), () => HttpResponse.json(current)),
    http.put(apiUrl('/kyc/profile'), async ({ request }) => {
      body = await request.json()
      current = kycStatus({ currentStep: 'identity', profile: { completed: true, countryCode: 'NG', phoneNumber: '+2348034567890' } })
      return HttpResponse.json(current)
    }),
  )
  renderRoute('/verify-identity')
  const user = userEvent.setup()

  expect(await screen.findByRole('heading', { name: 'Profile Basics' })).toBeInTheDocument()
  expect(screen.getByText('Salary is processed in NGN.')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Mobile Phone Number'), '0803 456 7890')
  await user.click(screen.getByRole('button', { name: 'Continue' }))

  expect(await screen.findByRole('heading', { name: 'Select Verification Region' })).toBeInTheDocument()
  expect(body).toEqual({ countryCode: 'NG', phoneNumber: '+2348034567890' })
  const steps = screen.getByRole('list', { name: 'Verification steps' })
  expect(within(steps).getByText(/Identity Verification/).closest('li')).toHaveAttribute('aria-current', 'step')
})

test('a Nigerian user must enter exactly 11 digits before anything is sent', async () => {
  let called = false
  server.use(
    http.get(apiUrl('/kyc/status'), () =>
      HttpResponse.json(kycStatus({ currentStep: 'identity', profile: { completed: true, countryCode: 'NG' } })),
    ),
    http.post(apiUrl('/kyc/identity/nigeria'), () => ((called = true), HttpResponse.json({}))),
  )
  renderRoute('/verify-identity')
  const user = userEvent.setup()

  const input = await screen.findByLabelText('Bank Verification Number (BVN)')
  await user.type(input, '12345abc')
  expect(input).toHaveValue('12345')
  await user.click(screen.getByRole('button', { name: 'Verify BVN' }))

  expect(await screen.findByText('Your BVN is 11 digits.')).toBeInTheDocument()
  expect(called).toBe(false)

  await user.click(screen.getByRole('radio', { name: 'National ID (NIN)' }))
  expect(screen.getByLabelText('National Identification Number (NIN)')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Verify NIN' })).toBeInTheDocument()
})

test('a name mismatch from the provider is explained in plain words', async () => {
  server.use(
    http.get(apiUrl('/kyc/status'), () =>
      HttpResponse.json(kycStatus({ currentStep: 'identity', profile: { completed: true, countryCode: 'NG' } })),
    ),
    http.post(apiUrl('/kyc/identity/nigeria'), () =>
      HttpResponse.json({ message: 'Name mismatch', code: 'NAME_MISMATCH', statusCode: 422 }, { status: 422 }),
    ),
  )
  renderRoute('/verify-identity')
  const user = userEvent.setup()

  await user.type(await screen.findByLabelText('Bank Verification Number (BVN)'), '22234918239')
  await user.click(screen.getByRole('button', { name: 'Verify BVN' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('The name on this record does not match your PaySplit name.')
})

test('international users upload a document instead of a BVN', async () => {
  server.use(
    http.get(apiUrl('/kyc/status'), () =>
      HttpResponse.json(kycStatus({ currentStep: 'identity', profile: { completed: true, countryCode: 'GB' } })),
    ),
  )
  renderRoute('/verify-identity')
  const user = userEvent.setup()

  await user.click(await screen.findByRole('button', { name: 'Submit for verification' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Choose a file.')
  expect(screen.queryByLabelText('Bank Verification Number (BVN)')).not.toBeInTheDocument()
})

test('a check that is still with the provider shows as pending, never as approved', async () => {
  server.use(
    http.get(apiUrl('/kyc/status'), () =>
      HttpResponse.json(
        kycStatus({ currentStep: 'liveness', kycStatus: 'in_progress', profile: { completed: true, countryCode: 'NG' }, identity: { status: 'passed' }, liveness: { status: 'pending' } }),
      ),
    ),
  )
  renderRoute('/verify-identity')

  expect(await screen.findByRole('heading', { name: "We're checking your details" })).toBeInTheDocument()
  expect(screen.getByText(/It is not approved yet/)).toBeInTheDocument()
  expect(screen.queryByText('Identity Approved')).not.toBeInTheDocument()
})
