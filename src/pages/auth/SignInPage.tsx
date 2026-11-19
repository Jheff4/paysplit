import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { TextField } from '@/components/ui/TextField'
import { accessTokenFrom, authApi } from '@/features/auth/api'
import { AuthActions, AuthBody, AuthHeader, authLinkClass } from '@/features/auth/AuthCard'
import { PasswordField } from '@/features/auth/PasswordField'
import { pendingSignup } from '@/features/auth/pendingSignup'
import { emailSchema } from '@/features/auth/schemas'
import { tokenStore } from '@/features/auth/tokenStore'
import { useAuth } from '@/features/auth/useAuth'

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
  rememberMe: z.boolean(),
})
type Values = z.infer<typeof schema>

function signInError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401 && !error.code) return 'Your email or password is incorrect.'
  return errorMessage(error)
}

export function SignInPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const expired = tokenStore.lastSignOutReason() === 'expired'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response, values) => signIn(accessTokenFrom(response), values.rememberMe),
    onError: (error, values) => {
      if (error instanceof ApiError && error.code === 'ACCOUNT_SETUP_INCOMPLETE') {
        pendingSignup.setEmail(values.email)
        navigate('/verify-email', { state: { notice: 'setup_incomplete' } })
      }
    },
  })

  const showError = login.isError && !(login.error instanceof ApiError && login.error.code === 'ACCOUNT_SETUP_INCOMPLETE')

  return (
    <>
      <AuthHeader title="Welcome back!" description="Please enter your details to sign in to your account." />
      <AuthBody>
        {expired && !login.isError && (
          <Alert tone="info" className="mb-4">
            Your session ended. Please sign in again.
          </Alert>
        )}
        {showError && (
          <Alert tone="error" live className="mb-4">
            {signInError(login.error)}
          </Alert>
        )}

        <form noValidate onSubmit={handleSubmit((values) => login.mutate(values))}>
          <div className="flex flex-col gap-4">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email')}
            />
            <PasswordField
              label="Password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
              <Checkbox label="Remember for 30 days" hint="Only on a device you don't share." {...register('rememberMe')} />
              <Link to="/forgot-password" className="text-sm font-medium text-link underline-offset-4 hover:underline">
                Forgot password
              </Link>
            </div>
          </div>
          <AuthActions>
            <Button type="submit" size="lg" loading={login.isPending} className="w-full">
              Sign in
            </Button>
            <p className="text-base text-muted">
              Don't have an account?{' '}
              <Link to="/sign-up" className={authLinkClass}>
                Create one
              </Link>
            </p>
          </AuthActions>
        </form>
      </AuthBody>
    </>
  )
}
