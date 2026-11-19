import { ArrowUp, Check, ChevronRight, Copy, Eye, EyeOff, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { DashboardSummary, SalaryAccount } from '@/api/types'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/lib/cn'
import { formatDay } from '@/lib/dates'
import { formatMoney } from '@/lib/money'

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard?.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }}
      className="grid size-10 place-items-center rounded-lg text-link hover:bg-brand-soft"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
    >
      {copied ? <Check aria-hidden="true" className="size-5" /> : <Copy aria-hidden="true" className="size-5" />}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  )
}

function AccountDetailsDialog({ account, children }: { account: SalaryAccount; children: ReactNode }) {
  const details = account.accounts.length
    ? account.accounts
    : account.accountNumber
      ? [{ accountNumber: account.accountNumber, bankName: account.bankName ?? '', accountName: account.accountName }]
      : []

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-surface p-5 shadow-modal">
          <div className="flex items-start justify-between">
            <Dialog.Title className="text-lg font-semibold text-ink">Salary account details</Dialog.Title>
            <Dialog.Close className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas" aria-label="Close">
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted">
            Give these details to your employer or payroll team so your salary is paid into PaySplit.
          </Dialog.Description>
          {details.map((d) => (
            <dl key={d.accountNumber} className="mt-4 flex flex-col gap-3 rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <div>
                  <dt className="text-xs text-muted">Account Number</dt>
                  <dd className="text-2xl font-medium tracking-wide text-ink">{d.accountNumber}</dd>
                </div>
                <CopyButton value={d.accountNumber} label="account number" />
              </div>
              <div>
                <dt className="text-xs text-muted">Account Name</dt>
                <dd className="text-sm text-ink">{d.accountName ?? account.accountName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Bank Name</dt>
                <dd className="text-sm text-ink">{d.bankName}</dd>
              </div>
            </dl>
          ))}
          <Link
            to="/settings"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand font-medium text-on-brand hover:bg-brand-hover"
          >
            View Profile
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SalaryAccountNote({ account }: { account: SalaryAccount }) {
  if (account.actionRequired === 'add_bvn_or_nin') {
    return (
      <Alert tone="warning" className="mt-3">
        Your salary account needs a BVN or NIN before it can be opened.{' '}
        <Link to="/settings" className="font-semibold underline">
          Add it in settings
        </Link>
      </Alert>
    )
  }
  switch (account.status) {
    case 'not_issued':
      return (
        <p className="text-sm text-muted">
          No salary account yet.{' '}
          <Link to="/verify-identity" className="font-medium text-link underline underline-offset-4">
            Verify your identity
          </Link>{' '}
          to get one.
        </p>
      )
    case 'pending':
      return <p className="text-sm text-muted">Your salary account is being opened. This can take a few minutes.</p>
    case 'failed':
      return (
        <Alert tone="error" className="mt-3">
          We could not open your salary account. Contact support and we will sort it out.
        </Alert>
      )
    case 'closed':
      return <p className="text-sm text-muted">This salary account is closed.</p>
    default:
      return null
  }
}

export function BalanceCard({ account }: { account: SalaryAccount }) {
  const [hidden, setHidden] = useState(false)
  const amount = formatMoney(account.balance, account.currency, undefined, { trimZeroMinor: true })

  return (
    <section aria-labelledby="balance-heading" className="flex flex-col justify-end gap-2 py-2">
      <h2 id="balance-heading" className="text-base text-ink sm:text-lg">
        Salary Account Balance
      </h2>
      <div className="flex items-center gap-3">
        <p className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {hidden ? (
            <>
              <span aria-hidden="true">••••••</span>
              <span className="sr-only">Balance hidden</span>
            </>
          ) : (
            amount
          )}
        </p>
        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          aria-pressed={hidden}
          aria-label="Hide balance"
          className="grid size-10 place-items-center rounded-lg text-ink hover:bg-canvas"
        >
          {hidden ? <EyeOff aria-hidden="true" className="size-6" /> : <Eye aria-hidden="true" className="size-6" />}
        </button>
      </div>
      {account.status === 'active' ? (
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
          <span>
            {account.maskedAccountNumber} {account.accountName}
          </span>
          <AccountDetailsDialog account={account}>
            <button type="button" className="min-h-8 font-medium text-link underline underline-offset-4">
              View Account Details
            </button>
          </AccountDetailsDialog>
        </p>
      ) : (
        <SalaryAccountNote account={account} />
      )}
    </section>
  )
}

function MetricCard({
  title,
  to,
  value,
  footer,
}: {
  title: string
  to: string
  value: ReactNode
  footer: ReactNode
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-[168px] flex-col justify-between rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-surface p-5 shadow-xs hover:shadow-md"
    >
      <span className="flex items-center justify-between text-base text-ink sm:text-lg">
        {title}
        <ChevronRight aria-hidden="true" className="size-5 text-muted group-hover:text-ink" />
      </span>
      <span className="text-3xl font-medium tracking-tight text-ink">{value}</span>
      <span className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">{footer}</span>
    </Link>
  )
}

function fundStatusLabel(status: string) {
  const text = status.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function MetricCards({ summary }: { summary: DashboardSummary }) {
  const currency = summary.salaryAccount.currency
  const money = (minor: number) => formatMoney(minor, currency, undefined, { trimZeroMinor: true })
  const { splitAllocation, wallets, nextSplitRun } = summary
  const fundOk = nextSplitRun.fundStatus === 'available' || nextSplitRun.fundStatus === 'funded'

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        title="Split Allocation"
        to="/split-rules"
        value={money(splitAllocation.amount)}
        footer={
          <>
            <span>
              {splitAllocation.activeRules
                ? `${splitAllocation.activeRules} ${splitAllocation.activeRules === 1 ? 'split' : 'splits'} running`
                : 'No split rule yet'}
            </span>
            {summary.income && (
              <span className="inline-flex items-center gap-1 text-success">
                <ArrowUp aria-hidden="true" className="size-4" />
                {splitAllocation.percentOfSalary}% of salary
              </span>
            )}
          </>
        }
      />
      <MetricCard
        title="Total in Wallets"
        to="/destinations"
        value={money(wallets.total)}
        footer={
          <>
            <span>
              {wallets.activeCount} active {wallets.activeCount === 1 ? 'wallet' : 'wallets'}
            </span>
            <span className="text-ink">{wallets.withTargetCount} with a target</span>
          </>
        }
      />
      <MetricCard
        title="Expected Next Split Run"
        to="/split-rules"
        value={nextSplitRun.date ? formatDay(nextSplitRun.date) : <span aria-label="Not scheduled">–</span>}
        footer={
          <>
            <span>Fund status:</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                fundOk ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
              )}
            >
              {fundStatusLabel(nextSplitRun.fundStatus)}
            </span>
          </>
        }
      />
    </div>
  )
}
