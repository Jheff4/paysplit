import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { mockDashboard, summary } from '@/test/fixtures'
import { apiUrl, renderRoute, server, setupMockApi } from '@/test/utils'

setupMockApi()

const heading = (name: string) => screen.findByRole('heading', { level: 1, name })

describe('sign in', () => {
  test('shows what is missing and sends nothing when the form is empty', async () => {
    let called = false
    server.use(http.post(apiUrl('/auth/login'), () => ((called = true), HttpResponse.json({}))))
    renderRoute('/sign-in')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter your email address.')
    expect(called).toBe(false)
  })

  test('signs in, remembers the device when asked, and returns to the page the user wanted', async () => {
    let body: unknown
    server.use(
      http.post(apiUrl('/auth/login'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ accessToken: 'abc' })
      }),
    )
    const { router } = renderRoute('/sign-in?next=%2Fdestinations')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'P@ssword123')
    await user.click(screen.getByLabelText('Remember for 30 days'))
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await heading('Destinations')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/destinations')
    expect(body).toEqual({ email: 'ada@example.com', password: 'P@ssword123', rememberMe: true })
    expect(localStorage.getItem('paysplit.session')).toBe('abc')
  })

  test('without "remember me" the session ends with the tab', async () => {
    server.use(http.post(apiUrl('/auth/login'), () => HttpResponse.json({ accessToken: 'abc' })))
    mockDashboard(summary())
    const { router } = renderRoute('/sign-in')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'P@ssword123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByRole('heading', { name: 'Complete Onboarding' })).toBeInTheDocument()
    expect(sessionStorage.getItem('paysplit.session')).toBe('abc')
    expect(localStorage.getItem('paysplit.session')).toBeNull()
  })

  test('wrong credentials explain the problem without revealing which field was wrong', async () => {
    server.use(
      http.post(apiUrl('/auth/login'), () => HttpResponse.json({ message: 'Invalid credentials', statusCode: 401 }, { status: 401 })),
    )
    renderRoute('/sign-in')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Your email or password is incorrect.')
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back!' })).toBeInTheDocument()
  })

  test('an unfinished sign-up is taken to email verification with a new code', async () => {
    server.use(
      http.post(apiUrl('/auth/login'), () =>
        HttpResponse.json({ message: 'Setup incomplete', code: 'ACCOUNT_SETUP_INCOMPLETE', statusCode: 401 }, { status: 401 }),
      ),
    )
    renderRoute('/sign-in')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'whatever1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await heading('Please check your email')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByText('Your sign-up was not finished. We emailed you a new code.')).toBeInTheDocument()
  })

  test('the password can be shown and hidden', async () => {
    renderRoute('/sign-in')
    const user = userEvent.setup()
    const input = await screen.findByLabelText('Password')
    const toggle = screen.getByRole('button', { name: 'Show password' })

    expect(input).toHaveAttribute('type', 'password')
    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('sign up', () => {
  test('an email that already has an account is flagged on the email field', async () => {
    server.use(
      http.post(apiUrl('/auth/signup'), () => HttpResponse.json({ message: 'Exists', statusCode: 409 }, { status: 409 })),
    )
    renderRoute('/sign-up')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('First Name'), 'Ada')
    await user.type(screen.getByLabelText('Last Name'), 'Obi')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('An account with this email already exists. Sign in instead.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  test('full journey: details, email code, password, then welcome', async () => {
    let setupAuth: string | null = null
    server.use(
      http.post(apiUrl('/auth/signup'), () => HttpResponse.json({ resendAvailableInSeconds: 30 }, { status: 201 })),
      http.post(apiUrl('/auth/email/verify'), async ({ request }) => {
        const { code } = (await request.json()) as { code: string }
        return code === '123456'
          ? HttpResponse.json({ setupToken: 'setup-1' })
          : HttpResponse.json({ message: 'Invalid code', statusCode: 401 }, { status: 401 })
      }),
      http.post(apiUrl('/auth/password/set'), ({ request }) => {
        setupAuth = request.headers.get('Authorization')
        return HttpResponse.json({ accessToken: 'session-1', onboarding: {} })
      }),
    )
    mockDashboard(summary())
    renderRoute('/sign-up')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('First Name'), 'Ada')
    await user.type(screen.getByLabelText('Last Name'), 'Obi')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await heading('Please check your email')
    expect(screen.getByRole('button', { name: /Resend in \d+s/ })).toBeDisabled()
    await user.type(screen.getByLabelText('Verification code'), '000000')
    await user.click(screen.getByRole('button', { name: 'Verify email' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That code is wrong or has expired.')

    await user.clear(screen.getByLabelText('Verification code'))
    await user.type(screen.getByLabelText('Verification code'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verify email' }))

    await heading('Create a password')
    const password = screen.getByLabelText('Password')
    await user.type(password, 'weak')
    expect(screen.getByText('An uppercase letter')).toHaveTextContent('(not yet)')
    await user.clear(password)
    await user.type(password, 'Str0ng!pass')
    expect(screen.getByText('An uppercase letter')).toHaveTextContent('(done)')
    await user.type(screen.getByLabelText('Confirm password'), 'Str0ng!pasX')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Confirm password'))
    await user.type(screen.getByLabelText('Confirm password'), 'Str0ng!pass')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    const welcome = await screen.findByRole('dialog', { name: 'Welcome to PaySplit' })
    expect(within(welcome).getByRole('button', { name: 'Continue to KYC' })).toBeInTheDocument()
    expect(setupAuth).toBe('Bearer setup-1')
    expect(sessionStorage.getItem('paysplit.pendingEmail')).toBeNull()
  })

  test('opening the password step without a fresh verification explains how to continue', async () => {
    renderRoute('/create-password')
    expect(await heading('Create a password')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Verify your email' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
  })
})

describe('forgot password', () => {
  test('email, code, new password, done', async () => {
    let resetBody: unknown
    server.use(
      http.post(apiUrl('/auth/password/forgot'), () => HttpResponse.json({})),
      http.post(apiUrl('/auth/password/verify-code'), () => HttpResponse.json({})),
      http.post(apiUrl('/auth/password/reset'), async ({ request }) => {
        resetBody = await request.json()
        return HttpResponse.json({})
      }),
    )
    renderRoute('/forgot-password')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: 'Send code' }))

    await heading('Check your email')
    await user.type(screen.getByLabelText('Reset code'), '654321')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await heading('Choose a new password')
    await user.type(screen.getByLabelText('New password'), 'N3w!password')
    await user.type(screen.getByLabelText('Confirm new password'), 'N3w!password')
    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    await heading('Password reset')
    expect(resetBody).toEqual({ email: 'ada@example.com', newPassword: 'N3w!password' })
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Password reset' })).toHaveFocus())
  })
})
