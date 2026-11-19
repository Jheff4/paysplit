import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import type { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { accessTokenFrom, authApi } from '@/features/auth/api'
import { AuthActions, AuthBody, AuthHeader, authLinkClass } from '@/features/auth/AuthCard'
import { PasswordField } from '@/features/auth/PasswordField'
import { pendingSignup } from '@/features/auth/pendingSignup'
import { newPasswordSchema } from '@/features/auth/schemas'
import { useAuth } from '@/features/auth/useAuth'

type Values = z.infer<typeof newPasswordSchema>

function setPasswordError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return (
      <>
        This step timed out.{' '}
        <Link to="/verify-email" className={authLinkClass}>
          Verify your email again
        </Link>
        .
      </>
    )
  }
  if (error instanceof ApiError && error.status === 409) {
    return (
      <>
        Your password is already set.{' '}
        <Link to="/sign-in" className={authLinkClass}>
          Sign in
        </Link>
        .
      </>
    )
  }
  return errorMessage(error)
}

export function CreatePasswordPage() {
  const { signIn } = useAuth()
  const setupToken = (useLocation().state as { setupToken?: string } | null)?.setupToken

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: '', confirmPassword: '' } })
  const password = useWatch({ control, name: 'password' })

  const setPassword = useMutation({
    mutationFn: (values: Values) => authApi.setPassword(setupToken ?? '', values),
    onSuccess: (response) => {
      pendingSignup.clear()
      pendingSignup.markWelcome()
      signIn(accessTokenFrom(response), false)
    },
  })

  if (!setupToken) {
    return (
      <>
        <AuthHeader title="Create a password" />
        <AuthBody className="pb-6">
          <Alert tone="info">
            For your security this step only works straight after verifying your email.{' '}
            <Link to="/verify-email" className={authLinkClass}>
              Verify your email
            </Link>
            .
          </Alert>
        </AuthBody>
      </>
    )
  }

  return (
    <>
      <AuthHeader title="Create a password" description="Your email is verified. Choose a strong password." />
      <AuthBody>
        {setPassword.isError && (
          <Alert tone="error" live className="mb-4">
            {setPasswordError(setPassword.error)}
          </Alert>
        )}
        <form noValidate onSubmit={handleSubmit((values) => setPassword.mutate(values))}>
          <div className="flex flex-col gap-4">
            <PasswordField
              label="Password"
              autoComplete="new-password"
              ruleValue={password}
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordField
              label="Confirm password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
          <AuthActions>
            <Button type="submit" size="lg" loading={setPassword.isPending} className="w-full">
              Create account
            </Button>
          </AuthActions>
        </form>
      </AuthBody>
    </>
  )
}
