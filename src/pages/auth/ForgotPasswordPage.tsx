import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { authApi } from '@/features/auth/api'
import { AuthBody, AuthHeader, authLinkClass } from '@/features/auth/AuthCard'
import { PasswordField } from '@/features/auth/PasswordField'
import { codeSchema, emailSchema, newPasswordSchema } from '@/features/auth/schemas'

type Step = { name: 'email' } | { name: 'code'; email: string } | { name: 'password'; email: string } | { name: 'done' }

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>({ name: 'email' })

  if (step.name === 'email') return <EmailStep onSent={(email) => setStep({ name: 'code', email })} />
  if (step.name === 'code') {
    return (
      <CodeStep
        email={step.email}
        onVerified={() => setStep({ name: 'password', email: step.email })}
        onChangeEmail={() => setStep({ name: 'email' })}
      />
    )
  }
  if (step.name === 'password') return <PasswordStep email={step.email} onDone={() => setStep({ name: 'done' })} />
  return (
    <>
      <AuthHeader title="Password reset" />
      <AuthBody className="pb-6">
      <Alert tone="success" live>
        Your password has been changed.
      </Alert>
      <Link
        to="/sign-in"
        className="mt-6 inline-flex min-h-15 w-full items-center justify-center rounded-xl bg-brand px-4 text-base font-medium text-on-brand shadow-xs hover:bg-brand-hover"
      >
        Sign in
      </Link>
      </AuthBody>
    </>
  )
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const schema = z.object({ email: emailSchema })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '' } })
  const send = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: (_, email) => onSent(email),
  })

  return (
    <>
      <AuthHeader title="Reset your password" description="Enter your email and we will send you a 6-digit code." />
      <AuthBody className="pb-6">
      {send.isError && (
        <Alert tone="error" live className="mb-4">
          {errorMessage(send.error)}
        </Alert>
      )}
      <form noValidate onSubmit={handleSubmit(({ email }) => send.mutate(email.trim()))} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" size="lg" loading={send.isPending} className="w-full">
          Send code
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/sign-in" className={authLinkClass}>
          Back to sign in
        </Link>
      </p>
      </AuthBody>
    </>
  )
}

function CodeStep({
  email,
  onVerified,
  onChangeEmail,
}: {
  email: string
  onVerified: () => void
  onChangeEmail: () => void
}) {
  const schema = z.object({ code: codeSchema })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { code: '' } })
  const verify = useMutation({ mutationFn: authApi.verifyResetCode, onSuccess: onVerified })
  const error =
    verify.error instanceof ApiError && verify.error.status === 401
      ? 'That code is wrong or has expired.'
      : verify.error && errorMessage(verify.error)

  return (
    <>
      <AuthHeader
        title="Check your email"
        description={
          <>
            If <strong className="break-all text-ink">{email}</strong> has a PaySplit account, we sent it a 6-digit code.
          </>
        }
      />
      <AuthBody className="pb-6">
      {error && (
        <Alert tone="error" live className="mb-4">
          {error}
        </Alert>
      )}
      <form
        noValidate
        onSubmit={handleSubmit(({ code }) => verify.mutate({ email, code: code.trim() }))}
        className="flex flex-col gap-4"
      >
        <TextField
          label="Reset code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          error={errors.code?.message}
          {...register('code')}
        />
        <Button type="submit" size="lg" loading={verify.isPending} className="w-full">
          Continue
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <button type="button" onClick={onChangeEmail} className={authLinkClass}>
          Use a different email
        </button>
      </p>
      </AuthBody>
    </>
  )
}

function PasswordStep({ email, onDone }: { email: string; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const password = useWatch({ control, name: 'password' })
  const reset = useMutation({
    mutationFn: (newPassword: string) => authApi.resetPassword({ email, newPassword }),
    onSuccess: onDone,
  })
  const error =
    reset.error instanceof ApiError && reset.error.status === 401
      ? 'Your reset code expired. Start again to get a new one.'
      : reset.error && errorMessage(reset.error)

  return (
    <>
      <AuthHeader title="Choose a new password" />
      <AuthBody className="pb-6">
      {error && (
        <Alert tone="error" live className="mb-4">
          {error}
        </Alert>
      )}
      <form noValidate onSubmit={handleSubmit(({ password }) => reset.mutate(password))} className="flex flex-col gap-4">
        <PasswordField
          label="New password"
          autoComplete="new-password"
          ruleValue={password}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" loading={reset.isPending} className="w-full">
          Reset password
        </Button>
      </form>
      </AuthBody>
    </>
  )
}
