import { useQuery } from '@tanstack/react-query'
import { Check, Split, Users, Wallet, Banknote } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Onboarding } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { QueryView } from '@/components/ui/states'
import { useAccountCurrency } from '@/features/account/useAccountCurrency'
import { BeneficiaryForm } from '@/features/beneficiaries/BeneficiaryForm'
import { setupApi, setupKeys } from '@/features/setup/api'
import { IncomeForm } from '@/features/setup/IncomeForm'
import { WalletForm } from '@/features/wallets/WalletForm'
import { StepHeading } from '@/features/kyc/StepHeading'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'

const STEPS = [
  { key: 'income', label: 'Income', detail: 'Salary info', Icon: Banknote },
  { key: 'wallet', label: 'Wallets', detail: 'Saving fund', Icon: Wallet },
  { key: 'recipient', label: 'Recipients', detail: 'Beneficiary', Icon: Users },
  { key: 'rule', label: 'Rules', detail: 'Split strategy', Icon: Split },
] as const
type StepKey = (typeof STEPS)[number]['key']

function firstOpenStep(onboarding: Onboarding): StepKey {
  const c = onboarding.setupChecklist
  if (!c.salaryDateSet) return 'income'
  if (!c.hasWallet) return 'wallet'
  if (!c.hasBeneficiary) return 'recipient'
  return 'rule'
}

function isDone(onboarding: Onboarding, key: StepKey) {
  const c = onboarding.setupChecklist
  return { income: c.salaryDateSet, wallet: c.hasWallet, recipient: c.hasBeneficiary, rule: c.hasSplitRule }[key]
}

function Stepper({ onboarding, current }: { onboarding: Onboarding; current: StepKey }) {
  return (
    <ol aria-label="Setup steps" className="grid grid-cols-4 gap-2">
      {STEPS.map(({ key, label, detail, Icon }) => {
        const done = isDone(onboarding, key)
        const active = key === current
        return (
          <li key={key} aria-current={active ? 'step' : undefined} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                'grid size-10 place-items-center rounded-full',
                active ? 'bg-brand text-on-brand' : done ? 'bg-success-soft text-success' : 'bg-chip text-muted',
              )}
            >
              {done && !active ? <Check aria-hidden="true" className="size-5" /> : <Icon aria-hidden="true" className="size-5" />}
            </span>
            <span className={cn('text-xs font-medium', active ? 'text-link' : 'text-ink')}>{label}</span>
            <span className="hidden text-xs text-muted sm:block">{detail}</span>
            <span className="sr-only">{done ? ', done' : active ? ', current step' : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Wizard({ onboarding }: { onboarding: Onboarding }) {
  const navigate = useNavigate()
  const currency = useAccountCurrency()
  const income = useQuery({ queryKey: setupKeys.income, queryFn: setupApi.income })
  const [step, setStep] = useState<StepKey>(() => firstOpenStep(onboarding))
  const index = STEPS.findIndex((s) => s.key === step)
  const next = () => setStep(STEPS[Math.min(index + 1, STEPS.length - 1)]!.key)
  const back = () => setStep(STEPS[Math.max(index - 1, 0)]!.key)

  const backButton = (
    <Button variant="secondary" size="lg" className="flex-1" onClick={back}>
      Go back
    </Button>
  )
  const skipButton = (
    <Button variant="secondary" size="lg" className="flex-1" onClick={next}>
      Skip
    </Button>
  )

  return (
    <div className="mx-auto flex w-full max-w-[678px] flex-col gap-6 rounded-[20px] bg-surface p-5 shadow-modal sm:p-8">
      <div className="text-center">
        <h1 tabIndex={-1} className="text-2xl font-medium text-heading outline-none">
          Configure your Salary Partitions
        </h1>
        <p className="mt-1 text-sm text-muted">Complete 4 steps to start splitting your salary automatically.</p>
      </div>
      <Stepper onboarding={onboarding} current={step} />

      {step === 'income' && (
        <section className="flex flex-col gap-4">
          <StepHeading title="Salary Income Source" description="Tell us where your salary comes from and when it usually lands." />
          <QueryView query={income} errorTitle="We could not load your income">
            {(data) => <IncomeForm currency={currency} income={data.income} submitLabel="Next" secondary={skipButton} onSaved={next} />}
          </QueryView>
        </section>
      )}
      {step === 'wallet' && (
        <section className="flex flex-col gap-4">
          <StepHeading title="Create your first wallet" description="A wallet keeps part of your salary for a purpose." />
          <WalletForm currency={currency} secondary={backButton} showRuleAction={false} onSaved={next} />
        </section>
      )}
      {step === 'recipient' && (
        <section className="flex flex-col gap-4">
          <StepHeading title="Add your first beneficiary" description="Someone you send money to every month." />
          <BeneficiaryForm secondary={backButton} showRuleAction={false} onSaved={next} />
        </section>
      )}
      {step === 'rule' && (
        <section className="flex flex-col gap-4">
          <StepHeading title="Create your first split rule" description="Decide how much goes to each wallet or beneficiary." />
          <Link
            to="/split-rules?create=1"
            className="inline-flex min-h-15 items-center justify-center rounded-xl bg-brand px-4 font-medium text-on-brand hover:bg-brand-hover"
          >
            Create a split rule
          </Link>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {backButton}
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => navigate('/')}>
              Finish later
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

export function SetupPage() {
  usePageTitle('Setup Checklist')
  const progress = useQuery({ queryKey: setupKeys.progress, queryFn: setupApi.progress })
  return (
    <div className="py-4">
      <QueryView query={progress} errorTitle="We could not load your setup progress">
        {(data) => <Wizard onboarding={data.onboarding} />}
      </QueryView>
    </div>
  )
}
