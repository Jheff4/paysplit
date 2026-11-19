import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { TextField } from '@/components/ui/TextField'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/dates'
import { imageFileProblem, kycApi, type Country, type KycStatus } from './api'
import { StepHeading } from './StepHeading'

function identityError(error: unknown, status: KycStatus): string | null {
  if (!error) return null
  if (error instanceof ApiError && error.status === 429 && status.steps.identity.retryAvailableAt) {
    return `You have used all your attempts for today. Try again after ${formatDateTime(status.steps.identity.retryAvailableAt)}.`
  }
  return errorMessage(error)
}

function RegionCards({ region }: { region: Country['region'] }) {
  const cards = [
    { value: 'nigeria', title: 'Nigeria Identity', detail: 'BVN or NIN' },
    { value: 'international', title: 'International ID', detail: "Passport or driver's licence" },
  ] as const
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">Verification region, set by your country</legend>
      {cards.map((card) => {
        const selected = card.value === region
        return (
          <div
            key={card.value}
            className={cn(
              'flex items-start justify-between rounded-xl border p-4',
              selected ? 'border-link bg-brand-soft' : 'border-line text-muted',
            )}
          >
            <div>
              <p className={cn('text-sm font-medium', selected ? 'text-ink' : 'text-muted')}>{card.title}</p>
              <p className="text-xs text-muted">{card.detail}</p>
            </div>
            <span
              aria-hidden="true"
              className={cn('mt-0.5 grid size-5 place-items-center rounded-full border-2', selected ? 'border-link' : 'border-field')}
            >
              {selected && <span className="size-2.5 rounded-full bg-link" />}
            </span>
            <span className="sr-only">{selected ? 'Selected, based on your country' : 'Not available for your country'}</span>
          </div>
        )
      })}
    </fieldset>
  )
}

function NigeriaForm({ status }: { status: KycStatus }) {
  const queryClient = useQueryClient()
  const [method, setMethod] = useState<'bvn' | 'nin'>('bvn')
  const [idNumber, setIdNumber] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const label = method === 'bvn' ? 'Bank Verification Number (BVN)' : 'National Identification Number (NIN)'

  const verify = useMutation({
    mutationFn: () => kycApi.verifyNigeria({ method, idNumber }),
    onSuccess: () => {
      setIdNumber('')
      return queryClient.invalidateQueries({ queryKey: ['kyc'] })
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ['kyc'] }),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^\d{11}$/.test(idNumber)) {
      setFieldError(`Your ${method.toUpperCase()} is 11 digits.`)
      return
    }
    setFieldError(undefined)
    verify.mutate()
  }

  const error = identityError(verify.error, status)
  const { attemptsRemaining } = status.steps.identity

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <SegmentedControl
        label="Select identity verification method"
        value={method}
        onChange={(next) => {
          setMethod(next)
          setFieldError(undefined)
        }}
        options={[
          { value: 'bvn', label: 'Bank Verification Number (BVN)' },
          { value: 'nin', label: 'National ID (NIN)' },
        ]}
      />
      {error && (
        <Alert tone="error" live>
          {error}
        </Alert>
      )}
      <TextField
        label={label}
        inputMode="numeric"
        autoComplete="off"
        maxLength={11}
        placeholder="e.g. 22234918239"
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
        error={fieldError}
        hint={
          method === 'bvn'
            ? 'Dial *565*0# from the phone number linked to your bank to get your BVN. We check that the name on it matches your PaySplit name.'
            : 'Your NIN is the 11-digit number on your NIN slip or in the NIMC app. We check that the name on it matches your PaySplit name.'
        }
      />
      <p className="text-sm text-muted">
        {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} left today.
      </p>
      <Button type="submit" size="lg" loading={verify.isPending} disabled={attemptsRemaining === 0} className="w-full">
        Verify {method.toUpperCase()}
      </Button>
    </form>
  )
}

function FilePicker({ label, file, onFile, optional }: { label: string; file?: File; onFile: (f?: File) => void; optional?: boolean }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-field bg-surface p-4 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-link hover:bg-canvas"
      >
        <Upload aria-hidden="true" className="size-6 text-muted" />
        <span className="text-sm">
          <span className="font-medium text-link">{label}</span>
          {optional && <span className="text-muted"> (optional)</span>}
        </span>
        <span className="text-xs text-muted">{file ? file.name : 'PNG or JPG, max 2 MB'}</span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  )
}

function InternationalForm({ status }: { status: KycStatus }) {
  const queryClient = useQueryClient()
  const [documentType, setDocumentType] = useState<'passport' | 'drivers_license'>('passport')
  const [front, setFront] = useState<File>()
  const [back, setBack] = useState<File>()
  const [fieldError, setFieldError] = useState<string>()

  const submitDocs = useMutation({
    mutationFn: () => kycApi.verifyInternational(documentType, front as File, back),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kyc'] }),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const problem = imageFileProblem(front, true) ?? imageFileProblem(back, false)
    setFieldError(problem ?? undefined)
    if (!problem) submitDocs.mutate()
  }

  const error = identityError(submitDocs.error, status)

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <SegmentedControl
        label="Select identity document"
        value={documentType}
        onChange={setDocumentType}
        options={[
          { value: 'passport', label: 'Passport' },
          { value: 'drivers_license', label: "Driver's licence" },
        ]}
      />
      {error && (
        <Alert tone="error" live>
          {error}
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <FilePicker label="Upload the front" file={front} onFile={setFront} />
        <FilePicker label="Upload the back" file={back} onFile={setBack} optional />
      </div>
      {fieldError && (
        <p role="alert" className="text-sm text-danger">
          {fieldError}
        </p>
      )}
      <Button type="submit" size="lg" loading={submitDocs.isPending} className="w-full">
        Submit for verification
      </Button>
    </form>
  )
}

export function IdentityStep({ status, countries }: { status: KycStatus; countries: Country[] }) {
  const country = countries.find((c) => c.code === status.steps.profile.countryCode)
  const region = country?.region ?? 'nigeria'
  const { status: identityStatus, failureReason } = status.steps.identity

  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        title="Select Verification Region"
        description="Provide government identification credentials corresponding to your country."
      />
      <RegionCards region={region} />
      {identityStatus === 'failed' && failureReason && (
        <Alert tone="warning" title="Your last attempt did not pass">
          {failureReason}
        </Alert>
      )}
      {region === 'nigeria' ? <NigeriaForm status={status} /> : <InternationalForm status={status} />}
    </div>
  )
}
