import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, Copy, KeyRound } from 'lucide-react'
import { Switch } from 'radix-ui'
import { useId, useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { TextField } from '@/components/ui/TextField'
import { accessTokenFrom } from '@/features/auth/api'
import { PasswordField } from '@/features/auth/PasswordField'
import { passwordSchema } from '@/features/auth/schemas'
import { tokenStore } from '@/features/auth/tokenStore'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/dates'
import { PHOTO_MAX_BYTES, PHOTO_TYPES, settingsApi, settingsKeys, type Channel, type Profile, type Topic } from './api'

export function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={cn('flex flex-col gap-3 rounded-[20px] border border-line bg-[#f9f9f9] p-2', className)}>
      <h2 id={id} className="px-4 pt-3 text-lg text-ink">
        {title}
      </h2>
      <div className="rounded-[16px] border border-line bg-surface p-4">{children}</div>
    </section>
  )
}

function CopyInline({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      onClick={async () => {
        await navigator.clipboard?.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }}
      className="grid size-9 place-items-center rounded-lg text-ink hover:bg-canvas"
    >
      {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
    </button>
  )
}

export function ProfileCard({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const inputId = useId()
  const [problem, setProblem] = useState<string>()
  const { user } = profile
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
  const refresh = () => queryClient.invalidateQueries({ queryKey: settingsKeys.profile })
  const upload = useMutation({ mutationFn: settingsApi.uploadPhoto, onSuccess: refresh })
  const remove = useMutation({ mutationFn: settingsApi.removePhoto, onSuccess: refresh })
  const error = problem ?? (upload.error ? errorMessage(upload.error) : remove.error ? errorMessage(remove.error) : undefined)

  return (
    <section aria-label="Your profile" className="flex flex-col gap-5 rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-surface p-5">
      <div className="flex items-center gap-4">
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt="" className="size-20 rounded-full border-4 border-surface object-cover" />
        ) : (
          <span aria-hidden="true" className="grid size-20 place-items-center rounded-full border-4 border-surface bg-brand-soft text-2xl font-semibold text-link">
            {initials}
          </span>
        )}
        <div>
          <p className="text-2xl text-ink">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-muted">Tier {profile.tier}</p>
        </div>
      </div>
      <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Account ID:</dt>
          <dd className="flex items-center gap-1 text-ink">
            {profile.accountId}
            <CopyInline value={profile.accountId} label="account ID" />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Member since:</dt>
          <dd className="text-ink">{formatDate(profile.memberSince)}</dd>
        </div>
      </dl>
      {error && (
        <Alert tone="error" live>
          {error}
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={inputId}
          className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-link px-4 font-medium text-link focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-link hover:bg-brand-soft"
        >
          <Camera aria-hidden="true" className="size-4" />
          {upload.isPending ? 'Uploading...' : 'Change profile photo'}
          <input
            id={inputId}
            type="file"
            accept={PHOTO_TYPES.join(',')}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              if (!PHOTO_TYPES.includes(file.type)) return setProblem('Use a PNG, JPG or WebP image.')
              if (file.size > PHOTO_MAX_BYTES) return setProblem('The photo must be 5 MB or smaller.')
              setProblem(undefined)
              upload.mutate(file)
            }}
          />
        </label>
        {user.profileImageUrl && (
          <Button variant="ghost" loading={remove.isPending} onClick={() => remove.mutate()}>
            Remove photo
          </Button>
        )}
      </div>
    </section>
  )
}

export function AccountDetails({ profile }: { profile: Profile }) {
  const account = profile.salaryAccount
  const number = account.accountNumber ?? account.accounts[0]?.accountNumber
  return (
    <Panel title="Account Details">
      {account.status === 'active' && number ? (
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-start justify-between">
            <div>
              <dt className="text-muted">Account Number:</dt>
              <dd className="text-3xl font-medium tracking-wide text-ink sm:text-4xl">{number}</dd>
            </div>
            <CopyInline value={number} label="account number" />
          </div>
          <div>
            <dt className="text-muted">Account Name:</dt>
            <dd className="text-ink">{account.accountName}</dd>
          </div>
          <div>
            <dt className="text-muted">Bank Name:</dt>
            <dd className="text-ink">{account.bankName ?? account.accounts[0]?.bankName}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-muted">
          {account.status === 'pending'
            ? 'Your salary account is being opened. This can take a few minutes.'
            : 'You get a salary account after your identity is verified.'}{' '}
          {account.status !== 'pending' && (
            <Link to="/verify-identity" className="font-medium text-link underline underline-offset-4">
              Verify your identity
            </Link>
          )}
        </p>
      )}
    </Panel>
  )
}

export function PersonalDetails({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const { user, namesLocked } = profile
  const schema = z.object({
    firstName: z.string().trim().min(1, 'Enter your first name.'),
    lastName: z.string().trim().min(1, 'Enter your last name.'),
    phoneNumber: z.string().trim().regex(/^(\+?[\d\s-]{6,16})?$/, 'Enter a valid phone number.'),
  })
  type Values = z.infer<typeof schema>
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber ?? '' },
  })
  const save = useMutation({
    mutationFn: (v: Values) =>
      settingsApi.updateProfile({
        ...(namesLocked ? {} : { firstName: v.firstName.trim(), lastName: v.lastName.trim() }),
        ...(v.phoneNumber ? { phoneNumber: v.phoneNumber.trim() } : {}),
      }),
    onSuccess: async (_, v) => {
      reset(v)
      await queryClient.invalidateQueries({ queryKey: settingsKeys.profile })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'INVALID_PHONE') {
        setError('phoneNumber', { message: 'Enter a valid phone number for your country.' }, { shouldFocus: true })
      }
    },
  })
  const lockHint = namesLocked ? 'Locked because your identity is verified.' : undefined

  return (
    <Panel title="Personal details">
      <form noValidate onSubmit={handleSubmit((v) => save.mutate(v))} className="flex flex-col gap-4">
        {save.isError && !(save.error instanceof ApiError && save.error.code === 'INVALID_PHONE') && (
          <Alert tone="error" live>
            {errorMessage(save.error)}
          </Alert>
        )}
        {save.isSuccess && !isDirty && (
          <Alert tone="success" live>
            Your details are saved.
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" disabled={namesLocked} hint={lockHint} error={errors.firstName?.message} {...register('firstName')} />
          <TextField label="Last name" autoComplete="family-name" disabled={namesLocked} hint={lockHint} error={errors.lastName?.message} {...register('lastName')} />
          <TextField label="Email address" type="email" value={user.email} readOnly hint="Your sign-in email cannot be changed." />
          <TextField label="Phone Number" type="tel" autoComplete="tel" error={errors.phoneNumber?.message} {...register('phoneNumber')} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={save.isPending} disabled={!isDirty}>
            Save details
          </Button>
        </div>
      </form>
    </Panel>
  )
}

const CHANNELS: Array<{ value: Channel; label: string }> = [
  { value: 'push', label: 'Push Notifications' },
  { value: 'sms', label: 'SMS Alerts' },
  { value: 'email', label: 'Email Notifications' },
]

export function NotificationSettings({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState<Channel>('email')
  const prefs = profile.notificationPreferences
  const delivered = prefs.deliveredChannels.includes(channel)
  const update = useMutation({
    mutationFn: ({ topic, on }: { topic: Topic; on: boolean }) => settingsApi.updatePreferences({ [channel]: { [topic]: on } }),
    onMutate: async ({ topic, on }) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.profile })
      const previous = queryClient.getQueryData<Profile>(settingsKeys.profile)
      if (previous) {
        queryClient.setQueryData<Profile>(settingsKeys.profile, {
          ...previous,
          notificationPreferences: {
            ...previous.notificationPreferences,
            preferences: {
              ...previous.notificationPreferences.preferences,
              [channel]: { ...previous.notificationPreferences.preferences[channel], [topic]: on },
            },
          },
        })
      }
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) queryClient.setQueryData(settingsKeys.profile, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: settingsKeys.profile }),
  })

  return (
    <Panel title="Notifications">
      <div className="flex flex-col gap-4">
        <SegmentedControl hideLabel label="Channel" value={channel} onChange={setChannel} options={CHANNELS} />
        {!delivered && (
          <Alert tone="info">PaySplit only sends email today. Your {channel === 'sms' ? 'SMS' : 'push'} choices are saved for when it is available.</Alert>
        )}
        {update.isError && (
          <Alert tone="error" live>
            We could not save that change, so we put it back. {errorMessage(update.error)}
          </Alert>
        )}
        <ul className="flex flex-col divide-y divide-line">
          {(Object.keys(prefs.topics) as Topic[]).map((topic) => {
            const id = `${channel}-${topic}`
            const on = prefs.preferences[channel][topic]
            return (
              <li key={topic} className="flex items-center justify-between gap-4 py-3">
                <label htmlFor={id} className="text-sm text-ink sm:text-base">
                  {prefs.topics[topic]}
                </label>
                <Switch.Root
                  id={id}
                  checked={on}
                  onCheckedChange={(next) => update.mutate({ topic, on: next })}
                  className="relative h-6 w-11 shrink-0 rounded-full bg-field transition-colors data-[state=checked]:bg-link"
                >
                  <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </li>
            )
          })}
        </ul>
        <p className="text-xs text-muted">Security and account notices are always sent, whatever you choose here.</p>
      </div>
    </Panel>
  )
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const schema = z
    .object({ currentPassword: z.string().min(1, 'Enter your current password.'), newPassword: passwordSchema, confirmPassword: z.string().min(1, 'Confirm your new password.') })
    .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })
  type Values = z.infer<typeof schema>
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })
  const newPassword = useWatch({ control, name: 'newPassword' })
  const change = useMutation({
    mutationFn: settingsApi.changePassword,
    onSuccess: (response) => {
      tokenStore.set(accessTokenFrom(response), tokenStore.isRemembered())
      onDone()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'INVALID_CURRENT_PASSWORD') {
        setError('currentPassword', { message: 'Your current password is incorrect.' }, { shouldFocus: true })
      }
      if (error instanceof ApiError && error.code === 'PASSWORD_UNCHANGED') {
        setError('newPassword', { message: 'Choose a password you have not used just now.' }, { shouldFocus: true })
      }
    },
  })
  const handled = change.error instanceof ApiError && ['INVALID_CURRENT_PASSWORD', 'PASSWORD_UNCHANGED'].includes(change.error.code ?? '')

  return (
    <form noValidate onSubmit={handleSubmit((v) => change.mutate(v))} className="flex flex-col gap-4">
      {change.isError && !handled && (
        <Alert tone="error" live>
          {errorMessage(change.error)}
        </Alert>
      )}
      <PasswordField label="Current password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
      <PasswordField label="New password" autoComplete="new-password" ruleValue={newPassword} error={errors.newPassword?.message} {...register('newPassword')} />
      <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <p className="text-sm text-muted">Changing your password signs you out on your other devices. You stay signed in here.</p>
      <Button type="submit" size="lg" loading={change.isPending}>
        Change password
      </Button>
    </form>
  )
}

export function SecuritySettings({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const [changed, setChanged] = useState(false)
  return (
    <Panel title="Security">
      {changed && (
        <Alert tone="success" live className="mb-3">
          Your password is changed. Your other devices have been signed out.
        </Alert>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base text-ink">Password</p>
          <p className="text-sm text-muted">
            {profile.security.passwordLastUpdated ? `Last updated ${formatDate(profile.security.passwordLastUpdated)}` : 'Never changed'}
          </p>
        </div>
        <Button variant="secondary" className="border-link text-link" onClick={() => setOpen(true)}>
          <KeyRound aria-hidden="true" className="size-4" />
          Change password
        </Button>
      </div>
      <Modal open={open} onOpenChange={setOpen} size="md" title="Change password">
        <ChangePasswordForm
          onDone={() => {
            setOpen(false)
            setChanged(true)
          }}
        />
      </Modal>
    </Panel>
  )
}
