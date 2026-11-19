import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/ui/OtpInput'
import { authApi } from '@/features/auth/api'
import { AuthBody, AuthHeader, authLinkClass } from '@/features/auth/AuthCard'
import { pendingSignup } from '@/features/auth/pendingSignup'
import { codeSchema } from '@/features/auth/schemas'
import { useCountdown } from '@/features/auth/useCountdown'

const schema = z.object({ code: codeSchema })
type Values = z.infer<typeof schema>
type LocationState = { resendIn?: number; notice?: 'setup_incomplete' } | null

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const state = useLocation().state as LocationState
  const email = pendingSignup.email()
  const [secondsLeft, setSecondsLeft] = useCountdown(state?.resendIn ?? 0)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { code: '' } })

  const verify = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (response) => navigate('/create-password', { replace: true, state: { setupToken: response.setupToken } }),
  })
  const resend = useMutation({
    mutationFn: () => authApi.resendCode(email),
    onSuccess: (response) => setSecondsLeft(response?.resendAvailableInSeconds ?? 0),
  })

  if (!email) {
    return (
      <>
        <AuthHeader title="Please check your email" />
        <AuthBody className="pb-6">
          <Alert tone="info">
            We don't know which email to verify.{' '}
            <Link to="/sign-up" className={authLinkClass}>
              Start sign up again
            </Link>{' '}
            or{' '}
            <Link to="/sign-in" className={authLinkClass}>
              sign in
            </Link>
            .
          </Alert>
        </AuthBody>
      </>
    )
  }

  const verifyError =
    verify.error instanceof ApiError && verify.error.status === 401
      ? 'That code is wrong or has expired. After 5 wrong tries the code stops working, so request a new one.'
      : verify.error && errorMessage(verify.error)

  return (
    <>
      <AuthHeader
        title="Please check your email"
        description={
          <>
            We've sent a code to <strong className="font-medium break-all text-ink">{email}</strong>
          </>
        }
      />
      <AuthBody className="pb-6">
        {state?.notice === 'setup_incomplete' && (
          <Alert tone="info" className="mb-4">
            Your sign-up was not finished. We emailed you a new code.
          </Alert>
        )}
        {verifyError && (
          <Alert tone="error" live className="mb-4">
            {verifyError}
          </Alert>
        )}
        {resend.isSuccess && (
          <Alert tone="success" live className="mb-4">
            We sent a new code. Check your inbox and spam folder.
          </Alert>
        )}
        {resend.isError && (
          <Alert tone="error" live className="mb-4">
            {errorMessage(resend.error)}
          </Alert>
        )}

        <form
          noValidate
          onSubmit={handleSubmit(({ code }) => verify.mutate({ email, code: code.trim() }))}
          className="flex flex-col gap-5"
        >
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <OtpInput
                label="Verification code"
                error={errors.code?.message}
                {...field}
                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            )}
          />
          <p className="text-center text-sm text-muted">
            Didn't get a code?{' '}
            <button
              type="button"
              onClick={() => resend.mutate()}
              disabled={secondsLeft > 0 || resend.isPending}
              className="font-medium text-link underline underline-offset-4 disabled:text-muted disabled:no-underline"
            >
              {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Click to resend'}
            </button>
          </p>
          <Button type="submit" size="lg" loading={verify.isPending} className="w-full">
            Verify email
          </Button>
          <Link to="/sign-up" className="text-center text-sm text-muted underline-offset-4 hover:underline">
            Use a different email
          </Link>
        </form>
      </AuthBody>
    </>
  )
}
