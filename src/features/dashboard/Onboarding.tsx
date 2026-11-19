import { ArrowRight, CircleCheck, UserRoundCheck, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useState } from 'react'
import { Link } from 'react-router'
import type { Onboarding } from '@/api/types'
import { Button } from '@/components/ui/Button'

function ProgressRing({ percent }: { percent: number }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <svg viewBox="0 0 80 80" className="size-20" role="img" aria-label={`${clamped}% complete`}>
      <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="8" className="stroke-chip" />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped / 100)}
        transform="rotate(-90 40 40)"
        className="stroke-brand"
      />
      <text x="40" y="45" textAnchor="middle" className="fill-ink text-sm font-semibold">
        {clamped}%
      </text>
    </svg>
  )
}

function Row({ title, detail, done, to }: { title: string; detail: string; done: boolean; to: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-line p-4">
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
      {done ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
          <CircleCheck aria-hidden="true" className="size-3.5" />
          Done
        </span>
      ) : (
        <Link
          to={to}
          className="inline-flex min-h-9 items-center rounded-lg bg-brand px-3 text-xs font-medium text-on-brand hover:bg-brand-hover"
        >
          Start <span className="sr-only">{title}</span>
        </Link>
      )}
    </li>
  )
}

export function OnboardingBanner({ onboarding }: { onboarding: Onboarding }) {
  const [open, setOpen] = useState(false)
  const { progress } = onboarding
  const kycDone = progress.kycCompleted

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <section
        aria-label="Complete onboarding"
        className="flex flex-col gap-4 rounded-[20px] border border-line bg-gradient-to-r from-brand-soft to-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-link shadow-xs">
            <UserRoundCheck aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-link">Complete Onboarding</h2>
            <p className="text-sm text-muted">
              {kycDone
                ? 'Add your salary, a wallet, a beneficiary and your first rule to start splitting.'
                : 'Verify your account to unlock splitting and get a dedicated account number.'}
            </p>
          </div>
        </div>
        <Dialog.Trigger asChild>
          <Button className="shrink-0">
            Complete Onboarding
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </Dialog.Trigger>
      </section>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-surface p-5 shadow-modal">
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted">Complete Onboarding</p>
            <Dialog.Close className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas" aria-label="Close">
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold text-ink">Complete your account setup</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">
                Verify your account to reach Tier 2, unlock splitting and get a dedicated account number.
              </Dialog.Description>
            </div>
            <ProgressRing percent={progress.percent} />
          </div>
          <ul className="mt-5 flex flex-col gap-3">
            <Row title="Signup Account" detail="Create your Paysplit account" done={progress.signupCompleted} to="/" />
            <Row title="Complete KYC" detail="Verify using a government-issued ID" done={kycDone} to="/verify-identity" />
            <Row
              title="Setup Checklist"
              detail="Add your salary source and set your first rule"
              done={progress.setupCompleted}
              to="/setup"
            />
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
