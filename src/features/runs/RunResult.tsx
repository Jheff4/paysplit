import { Link } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/lib/cn'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { formatDateTime } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import { runStatusLabel, type SplitRun } from './api'

function tone(status: string): 'success' | 'warning' | 'error' | 'info' {
  if (['success', 'successful', 'completed'].includes(status)) return 'success'
  if (['partial', 'partially_completed'].includes(status)) return 'warning'
  if (status === 'failed') return 'error'
  return 'info'
}

export function RunResult({
  run,
  currency,
  showLink = false,
  compact = false,
}: {
  run: SplitRun
  currency: string
  showLink?: boolean
  compact?: boolean
}) {
  const cur = currency
  const left = run.availableAmount - run.toWallets - run.toBeneficiaries - run.fees
  const money = (v: number | undefined) => (typeof v === 'number' ? formatMoney(v, cur) : '–')
  const skipped = run.skipped ?? []

  return (
    <div className="flex flex-col gap-4">
      <Alert tone={tone(run.status)} live title={runStatusLabel(run.status)}>
        {run.trigger ? `${run.trigger === 'manual' ? 'Run Now' : 'Automatic split'} · ` : ''}
        {formatDateTime(run.createdAt)}
        {['pending', 'processing'].includes(run.status) && '. Some transfers are still being confirmed by the bank.'}
      </Alert>
      <dl className={cn('grid gap-3 sm:grid-cols-2', !compact && 'lg:grid-cols-4')}>
        {[
          ['Salary used', run.baseAmount],
          ['To wallets', run.toWallets],
          ['To beneficiaries', run.toBeneficiaries],
          ['Left in salary account', left],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-line p-4">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-lg font-semibold text-ink">{money(value as number | undefined)}</dd>
          </div>
        ))}
      </dl>
      {skipped.length > 0 && (
        <section aria-labelledby={`skipped-${run.id}`} className="flex flex-col gap-2">
          <h3 id={`skipped-${run.id}`} className="text-sm font-semibold text-ink">
            Skipped rules
          </h3>
          <ul className="flex flex-col gap-2">
            {skipped.map((s, i) => (
              <li key={s.ruleId ?? i} className="rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm">
                <p className="font-medium text-ink">{s.ruleName ?? s.name ?? 'Rule'}</p>
                <p className="text-muted">
                  {s.reason === 'insufficient_funds' || !s.reason ? 'Skipped: insufficient funds' : `Skipped: ${s.reason.replace(/_/g, ' ')}`}
                  {typeof (s.requested ?? s.requestedAmount) === 'number' &&
                    `. Needed ${money(s.requested ?? s.requestedAmount)}, ${money(s.available ?? s.availableAmount)} was left.`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {run.transactions && run.transactions.length > 0 && (
        <TransactionTable rows={run.transactions} currency={cur} caption="Money moved in this split" compact={compact} />
      )}
      {showLink && (
        <Link to={`/split-runs/${run.id}`} className="text-sm font-medium text-link underline underline-offset-4">
          Open this split
        </Link>
      )}
    </div>
  )
}
