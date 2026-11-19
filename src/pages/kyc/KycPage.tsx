import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import kycIllustration from '@/assets/kyc-illustration.png'
import tickBold from '@/assets/tick-circle-bold.svg'
import tickLinear from '@/assets/tick-circle-linear.svg'
import welcomeCheck from '@/assets/welcome-check.svg'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { QueryView } from '@/components/ui/states'
import { kycApi, kycKeys, type KycStatus } from '@/features/kyc/api'
import { IdentityStep } from '@/features/kyc/IdentityStep'
import { LivenessStep } from '@/features/kyc/LivenessStep'
import { ProfileStep } from '@/features/kyc/ProfileStep'
import { StepHeading } from '@/features/kyc/StepHeading'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'

const STEPS = [
  { key: 'profile', label: 'Profile Basics' },
  { key: 'identity', label: 'Identity Verification' },
  { key: 'liveness', label: 'Biometrics Liveness' },
] as const
type StepKey = (typeof STEPS)[number]['key']

const IN_PROGRESS = new Set(['pending', 'in_review', 'processing'])

function isPending(status: KycStatus) {
  return IN_PROGRESS.has(status.steps.identity.status) || IN_PROGRESS.has(status.steps.liveness.status)
}

function stepDone(status: KycStatus, key: StepKey) {
  if (key === 'profile') return status.steps.profile.completed
  return status.steps[key].status === 'passed' || status.steps[key].status === 'approved'
}

function Stepper({ status, shown }: { status: KycStatus; shown: StepKey | 'done' }) {
  return (
    <ol aria-label="Verification steps" className="flex justify-between gap-2 lg:flex-col lg:items-center lg:gap-6">
      {STEPS.map((step) => {
        const done = stepDone(status, step.key)
        const current = step.key === shown
        return (
          <li
            key={step.key}
            aria-current={current ? 'step' : undefined}
            className="flex flex-1 flex-col items-center gap-2 text-center"
          >
            <img src={done || current ? tickBold : tickLinear} alt="" width={27} height={27} className={cn('size-7', !done && !current && 'opacity-60')} />
            <span
              className={cn(
                'text-sm lg:text-xl',
                current ? 'font-medium text-link' : done ? 'text-ink' : 'text-muted',
              )}
            >
              {step.label}
              <span className="sr-only">{done ? ', completed' : current ? ', current step' : ', not started'}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function ApprovedDialog({ open }: { open: boolean }) {
  const navigate = useNavigate()
  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content
          onEscapeKeyDown={() => navigate('/')}
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[415px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-surface p-6 text-center shadow-modal"
        >
          <span aria-hidden="true" className="mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-b from-black to-brand">
            <img src={welcomeCheck} alt="" width={40} height={27} className="h-7 w-10" />
          </span>
          <Dialog.Title className="mt-5 text-xl font-medium text-heading">Identity Approved</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted">
            Your identity and liveness checks have been confirmed by our verification partner. We are now opening your
            salary account.
          </Dialog.Description>
          <Button size="lg" className="mt-6 w-full" onClick={() => navigate('/')}>
            Continue to Setup Checklist
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function KycContent({ status }: { status: KycStatus }) {
  const countries = useQuery({ queryKey: kycKeys.countries, queryFn: kycApi.countries, staleTime: Infinity })
  const [viewing, setViewing] = useState<StepKey | null>(null)
  const [justApproved, setJustApproved] = useState(false)

  const approved = status.kycStatus === 'approved'
  const active: StepKey | 'done' = approved
    ? 'done'
    : ((STEPS.find((s) => s.key === status.currentStep)?.key ?? 'profile') as StepKey)
  const shown = viewing ?? active
  const shownIndex = STEPS.findIndex((s) => s.key === shown)
  const canGoBack = shown !== 'done' && shownIndex > 0

  let body
  if (shown === 'done') {
    body = (
      <div className="flex flex-col gap-6">
        <StepHeading title="You're verified" description="Your identity is confirmed. Next, set up your salary, wallets and rules." />
        <Link
          to="/"
          className="inline-flex min-h-15 items-center justify-center rounded-xl bg-brand px-4 font-medium text-on-brand shadow-xs hover:bg-brand-hover"
        >
          Go to Setup Checklist
        </Link>
      </div>
    )
  } else if (isPending(status)) {
    body = (
      <div className="flex flex-col gap-6">
        <StepHeading title="We're checking your details" description="This usually takes a minute. This page updates by itself." />
        <Alert tone="info" live title="Pending review">
          <span className="inline-flex items-center gap-2">
            <Clock aria-hidden="true" className="size-4" /> Your verification is with our partner. It is not approved yet.
          </span>
        </Alert>
      </div>
    )
  } else if (shown === 'identity' && stepDone(status, 'identity')) {
    body = (
      <div className="flex flex-col gap-6">
        <StepHeading title="Identity verified" description="Your ID check passed." />
        {status.steps.identity.maskedIdNumber && (
          <p className="text-base text-ink">
            {status.steps.identity.method?.toUpperCase()} {status.steps.identity.maskedIdNumber}
          </p>
        )}
        <Button size="lg" onClick={() => setViewing(null)}>
          Continue
        </Button>
      </div>
    )
  } else {
    body = (
      <QueryView query={countries} errorTitle="We could not load the list of countries">
        {(list) =>
          shown === 'profile' ? (
            <ProfileStep key={status.steps.profile.countryCode ?? 'new'} status={status} countries={list} />
          ) : shown === 'identity' ? (
            <IdentityStep status={status} countries={list} />
          ) : (
            <LivenessStep status={status} onApproved={() => setJustApproved(true)} />
          )
        }
      </QueryView>
    )
  }

  return (
    <div className="rounded-[32px] border border-line bg-surface p-2 sm:p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,492px)_1fr]">
        <aside className="flex flex-col gap-6 rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-[#eaf6ff00] p-4 lg:gap-12 lg:p-2.5 lg:pt-10">
          <img src={kycIllustration} alt="" width={144} height={144} className="mx-auto hidden size-36 mix-blend-luminosity lg:block" />
          <Stepper status={status} shown={shown} />
        </aside>

        <section aria-label="Current step" className="flex flex-col gap-4 rounded-[24px] border border-line bg-[#f9f9f9] p-2">
          <div className="flex items-center justify-between px-3 pt-2 sm:px-5">
            {canGoBack ? (
              <button
                type="button"
                onClick={() => setViewing(STEPS[shownIndex - 1]!.key)}
                className="inline-flex min-h-10 items-center gap-1.5 text-base text-ink"
              >
                <ArrowLeft aria-hidden="true" className="size-[18px]" />
                Previous
              </button>
            ) : (
              <span />
            )}
            {viewing ? (
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="inline-flex min-h-10 items-center gap-1.5 text-base text-link"
              >
                Back to current step
                <ArrowRight aria-hidden="true" className="size-[18px]" />
              </button>
            ) : (
              !approved && (
                <Link to="/" className="inline-flex min-h-10 items-center gap-1.5 text-base text-link">
                  Skip for now
                  <ArrowRight aria-hidden="true" className="size-[18px]" />
                </Link>
              )
            )}
          </div>
          <div className="flex min-h-[560px] flex-col rounded-[20px] border border-line bg-surface p-5 sm:p-10 xl:p-[70px]">
            {body}
          </div>
        </section>
      </div>
      <ApprovedDialog open={justApproved || false} />
    </div>
  )
}

export function KycPage() {
  usePageTitle('Complete KYC')
  const status = useQuery({
    queryKey: kycKeys.status,
    queryFn: kycApi.status,
    refetchInterval: (query) => (query.state.data && isPending(query.state.data) ? 5000 : false),
  })

  return (
    <>
      <header className="mb-5 flex flex-col gap-2">
        <h1 tabIndex={-1} className="text-2xl leading-8 text-black outline-none">
          Complete KYC
        </h1>
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link to="/" className="font-medium text-link hover:underline">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true" className="text-muted">
              /
            </li>
            <li aria-current="page" className="text-muted">
              Onboarding
            </li>
          </ol>
        </nav>
      </header>
      <QueryView query={status} errorTitle="We could not load your verification status">
        {(data) => <KycContent status={data} />}
      </QueryView>
    </>
  )
}
