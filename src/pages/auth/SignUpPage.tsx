import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { authApi } from '@/features/auth/api'
import { AuthActions, AuthBody, AuthHeader, authLinkClass } from '@/features/auth/AuthCard'
import { pendingSignup } from '@/features/auth/pendingSignup'
import { emailSchema, nameSchema } from '@/features/auth/schemas'

const schema = z.object({
  firstName: nameSchema('first name'),
  lastName: nameSchema('last name'),
  email: emailSchema,
})
type Values = z.infer<typeof schema>

export function SignUpPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { firstName: '', lastName: '', email: '' } })

  const signup = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (response, values) => {
      pendingSignup.setEmail(values.email.trim())
      navigate('/verify-email', { state: { resendIn: response?.resendAvailableInSeconds } })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setError('email', { message: 'An account with this email already exists. Sign in instead.' }, { shouldFocus: true })
      }
    },
  })

  const showError = signup.isError && !(signup.error instanceof ApiError && signup.error.status === 409)

  return (
    <>
      <AuthHeader
        title="Create an account"
        description="Use your legal name. It must match your ID when you verify your identity."
      />
      <AuthBody>
        {showError && (
          <Alert tone="error" live className="mb-4">
            {errorMessage(signup.error)}
          </Alert>
        )}
        <form noValidate onSubmit={handleSubmit((values) => signup.mutate(values))}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="First Name"
                autoComplete="given-name"
                placeholder="Enter first name"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <TextField
                label="Last Name"
                autoComplete="family-name"
                placeholder="Enter last name"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Enter your email"
              hint="We will send a 6-digit code to verify it."
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          <AuthActions>
            <Button type="submit" size="lg" loading={signup.isPending} className="w-full">
              Continue
            </Button>
            <p className="text-base text-muted">
              Already have an account?{' '}
              <Link to="/sign-in" className={authLinkClass}>
                Sign in
              </Link>
            </p>
          </AuthActions>
        </form>
      </AuthBody>
    </>
  )
}
