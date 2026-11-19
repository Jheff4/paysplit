import { RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import type { LinkedRule } from '@/features/wallets/api'
import { formatDate } from '@/lib/dates'
import { ruleValueLabel } from './format'

export function LinkedRuleCard({
  rule,
  currency,
  createHref,
}: {
  rule: LinkedRule | null | undefined
  currency: string
  createHref: string
}) {
  return (
    <section aria-labelledby="linked-rule" className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-5">
      <h2 id="linked-rule" className="text-base text-ink sm:text-lg">
        Linked Rule
      </h2>
      {rule ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
          <div>
            <p className="text-xs text-muted">Allocation method and value</p>
            <p className="text-lg font-medium text-ink">
              {ruleValueLabel(rule, currency)}
              <span className="ml-2 text-sm font-normal text-muted">
                {rule.method === 'percentage' ? 'of salary' : 'fixed'}
                {rule.status === 'paused' ? ' · paused' : ''}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            {rule.updatedAt && <span>Last modified {formatDate(rule.updatedAt)}</span>}
            <Link
              to={`/split-rules?edit=${encodeURIComponent(rule.id)}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-link px-3 text-sm font-medium text-link hover:bg-brand-soft"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Reconfigure Rule
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-field p-4">
          <p className="text-sm text-muted">No split rule yet. Nothing from your salary goes here until you create one.</p>
          <Link
            to={createHref}
            className="inline-flex min-h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover"
          >
            Create rule
          </Link>
        </div>
      )}
    </section>
  )
}
