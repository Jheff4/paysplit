import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ListSkeleton } from '@/components/ui/states'
import { dashboardApi, dashboardKeys } from '@/features/dashboard/api'
import { ruleDestinationName, rulesApi } from '@/features/rules/api'
import { ruleValueLabel } from '@/features/rules/format'
import { formatMoney } from '@/lib/money'
import { runsApi } from './api'
import { RunResult } from './RunResult'

export function RunNowButton({ currency }: { currency: string }) {
  const [open, setOpen] = useState(false)
  const summary = useQuery({ queryKey: dashboardKeys.summary, queryFn: dashboardApi.summary })
  const account = summary.data?.salaryAccount
  const reason = !account
    ? undefined
    : account.status !== 'active'
      ? 'Run Now is available once your salary account is active.'
      : account.balance <= 0
        ? 'There is no money in your salary account to split yet.'
        : undefined

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <Button variant="secondary" disabled={!account || !!reason} onClick={() => setOpen(true)} aria-describedby={reason ? 'run-now-reason' : undefined}>
          <Play aria-hidden="true" className="size-4" />
          Run Now
        </Button>
        {reason && (
          <p id="run-now-reason" className="max-w-56 text-right text-xs text-muted">
            {reason}
          </p>
        )}
      </div>
      {open && account && <RunNowDialog currency={currency} balance={account.balance} onClose={() => setOpen(false)} />}
    </>
  )
}

function RunNowDialog({ currency, balance, onClose }: { currency: string; balance: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const rules = useQuery({
    queryKey: ['split-rules', 'active-for-run'],
    queryFn: () => rulesApi.list(1, 'active', '', 100),
  })
  const run = useMutation({
    mutationFn: runsApi.runNow,
    onSettled: () =>
      Promise.all(
        [['split-runs'], ['split-rules'], ['dashboard'], ['wallets'], ['transactions'], ['notifications']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  })
  const ordered = [...(rules.data?.data ?? [])].sort(
    (a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt),
  )

  return (
    <Modal open onOpenChange={(open) => !open && !run.isPending && onClose()} title="Run Now" description="Split the money in your salary account now, using your active rules.">
      {run.isSuccess ? (
        <div className="flex flex-col gap-4">
          <RunResult run={run.data} currency={currency} showLink />
          <Button size="lg" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {run.isError && (
            <Alert tone="error" live>
              {errorMessage(run.error)}
            </Alert>
          )}
          <p className="rounded-xl bg-brand-soft p-3 text-sm text-ink">
            Available to split: <strong>{formatMoney(balance, currency)}</strong>
          </p>
          {rules.isPending ? (
            <ListSkeleton label="Loading your rules" rows={2} />
          ) : rules.isError ? (
            <Alert tone="error">{errorMessage(rules.error)}</Alert>
          ) : ordered.length === 0 ? (
            <Alert tone="warning">You have no active rules, so there is nothing to run.</Alert>
          ) : (
            <ol aria-label="Rules in the order they will run" className="flex flex-col gap-2">
              {ordered.map((rule) => (
                <li key={rule.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm">
                  <span className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-chip text-xs font-semibold">{rule.priority}</span>
                    <span>
                      <span className="block font-medium text-ink">{rule.name}</span>
                      <span className="block text-xs text-muted">{ruleDestinationName(rule)}</span>
                    </span>
                  </span>
                  <span className="font-medium text-ink">{ruleValueLabel(rule, currency)}</span>
                </li>
              ))}
            </ol>
          )}
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Rules run from priority 1 down. Equal priorities run oldest first.</li>
            <li>A rule that does not fully fit is skipped, never paid in part.</li>
            <li>Percentage rules use the balance at the moment the split runs, so PaySplit confirms the final amounts.</li>
            <li>Money already split is never split again.</li>
          </ul>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="secondary" size="lg" className="flex-1" disabled={run.isPending} onClick={onClose}>
              Cancel
            </Button>
            <Button size="lg" className="flex-1" loading={run.isPending} disabled={ordered.length === 0} onClick={() => run.mutate()}>
              Run split now
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
