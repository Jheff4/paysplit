import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pause, Pencil, Play, Plus, Split, Trash2 } from 'lucide-react'
import { AlertDialog } from 'radix-ui'
import { useDeferredValue, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchField } from '@/components/ui/SearchField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState, FormSkeleton, ListSkeleton, LoadingStatus, QueryView, Skeleton, TableSkeleton } from '@/components/ui/states'
import { useAccountCurrency } from '@/features/account/useAccountCurrency'
import { ruleDestinationName, ruleKeys, rulesApi, type DestinationType, type RulesSummary, type SplitRule } from '@/features/rules/api'
import { ruleValueLabel } from '@/features/rules/format'
import { RuleForm } from '@/features/rules/RuleForm'
import { runKeys, runsApi, runStatusLabel } from '@/features/runs/api'
import { RunNowButton } from '@/features/runs/RunNowDialog'
import { formatDateTime } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import { usePageTitle } from '@/lib/usePageTitle'

const SEGMENT_COLOURS = ['#33a7f5', '#2dd4bf', '#171918', '#0f324a', '#1e3a8a', '#5cb9f7', '#7c3aed', '#a3510a']

function SummarySkeleton() {
  return (
    <LoadingStatus
      label="Loading your allocation summary"
      className="flex flex-col gap-4 rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-surface p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-xl sm:h-[54px]" />
    </LoadingStatus>
  )
}

function SummaryCard({ summary, currency }: { summary: RulesSummary; currency: string }) {
  const money = (v: number) => formatMoney(v, currency, undefined, { trimZeroMinor: true })
  return (
    <section aria-labelledby="baseline" className="flex flex-col gap-4 rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="baseline" className="text-xs text-muted">
            Monthly Salary Baseline
          </h2>
          <p className="text-3xl font-medium text-ink">{summary.baselineSalary === null ? '–' : money(summary.baselineSalary)}</p>
        </div>
        <dl className="flex gap-6 text-right">
          <div>
            <dt className="text-xs text-muted">Total Allocated</dt>
            <dd className="font-medium text-ink">{money(summary.totalAllocated)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Unallocated</dt>
            <dd className="font-medium text-success">{money(summary.remainder)}</dd>
          </div>
        </dl>
      </div>
      {summary.baselineSalary === null ? (
        <Alert tone="info">
          <Link to="/setup" className="font-semibold underline">
            Add your monthly salary
          </Link>{' '}
          so we can show how much of it your rules use and stop rules that would use more than you earn.
        </Alert>
      ) : (
        <>
          <div className="flex justify-between text-xs text-muted">
            <span>
              Allocation progress: <strong className="text-ink">{summary.allocatedPercent}% of salary</strong>
            </span>
            <span>{money(summary.remainder)} unallocated</span>
          </div>
          <div
            role="img"
            aria-label={`${summary.allocatedPercent}% of your salary is allocated by your rules`}
            className="flex h-4 overflow-hidden rounded-full bg-chip"
          >
            {summary.segments.map((s, i) => (
              <span key={s.ruleId ?? s.name} style={{ width: `${s.percent}%`, backgroundColor: SEGMENT_COLOURS[i % SEGMENT_COLOURS.length] }} />
            ))}
          </div>
          {summary.overAllocated && (
            <Alert tone="error" live>
              Your active rules add up to more than your salary. Some will be skipped when your salary arrives.
            </Alert>
          )}
          {summary.segments.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink" aria-label="Allocation by rule">
              {summary.segments.map((s, i) => (
                <li key={s.ruleId ?? s.name} className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: SEGMENT_COLOURS[i % SEGMENT_COLOURS.length] }} />
                  {s.name} ({s.percent}%)
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

function DeleteRule({ rule, onClose }: { rule: SplitRule | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: (id: string) => rulesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['split-rules'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })
  return (
    <AlertDialog.Root open={!!rule} onOpenChange={(open) => !open && (remove.reset(), onClose())}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-surface p-6 shadow-modal">
          <AlertDialog.Title className="text-lg font-semibold text-heading">Delete “{rule?.name}”?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">
            Future salary will no longer go to {rule ? ruleDestinationName(rule) : 'this destination'}. Past splits stay in your history.
          </AlertDialog.Description>
          {remove.isError && (
            <Alert tone="error" live className="mt-4">
              {errorMessage(remove.error)}
            </Alert>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" className="flex-1">
                Keep rule
              </Button>
            </AlertDialog.Cancel>
            <Button variant="danger" className="flex-1" loading={remove.isPending} onClick={() => rule && remove.mutate(rule.id)}>
              Delete rule
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

function RulesTable({ currency }: { currency: string }) {
  const queryClient = useQueryClient()
  const [, setParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'all' | 'active' | 'paused'>('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<SplitRule | null>(null)
  const q = useDeferredValue(search.trim())
  const list = useQuery({ queryKey: ruleKeys.list(page, status, q), queryFn: () => rulesApi.list(page, status, q), placeholderData: (p) => p })
  const toggle = useMutation({
    mutationFn: (rule: SplitRule) => rulesApi.update(rule.id, { status: rule.status === 'active' ? 'paused' : 'active' }),
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ['split-rules'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] })]),
  })

  return (
    <section aria-labelledby="all-rules" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="all-rules" className="text-base text-ink sm:text-lg">
          All Salary Rules
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <SearchField label="Search rules" value={search} onChange={(v) => (setSearch(v), setPage(1))} />
          <SegmentedControl
            hideLabel
            label="Status"
            value={status}
            onChange={(v) => (setStatus(v), setPage(1))}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
            ]}
          />
        </div>
      </div>
      {toggle.isError && (
        <Alert tone="error" live>
          {errorMessage(toggle.error)}
        </Alert>
      )}
      <QueryView
        query={list}
        loading={<TableSkeleton label="Loading your rules" columns={7} rows={4} />}
        errorTitle="We could not load your rules"
        isEmpty={(d) => d.data.length === 0}
        empty={
          q || status !== 'all' ? (
            <p className="py-8 text-center text-sm text-muted">No rules match.</p>
          ) : (
            <EmptyState
              icon={<Split aria-hidden="true" className="size-8" />}
              title="No split rules yet"
              description="A rule says how much of your salary goes to a wallet or a beneficiary each month."
              action={
                <Button onClick={() => setParams({ create: '1' })}>
                  <Plus aria-hidden="true" className="size-4" />
                  Add your first rule
                </Button>
              }
            />
          )
        }
      >
        {(d) => (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">Split rules in priority order</caption>
                <thead className="text-xs text-muted">
                  <tr className="border-b border-line">
                    <th scope="col" className="py-3 font-normal">Priority</th>
                    <th scope="col" className="py-3 font-normal">Rule Name</th>
                    <th scope="col" className="py-3 font-normal">Destination</th>
                    <th scope="col" className="py-3 font-normal">Method</th>
                    <th scope="col" className="py-3 font-normal">Date Created</th>
                    <th scope="col" className="py-3 font-normal">Allocated This Month</th>
                    <th scope="col" className="py-3 text-right font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {d.data.map((rule) => (
                    <tr key={rule.id} className="border-b border-line last:border-0">
                      <td className="py-3 text-ink">{rule.priority}</td>
                      <td className="py-3 text-ink">
                        {rule.name}
                        {rule.status === 'paused' && <span className="ml-2 rounded-full bg-chip px-2 py-0.5 text-xs text-muted">Paused</span>}
                      </td>
                      <td className="py-3 text-ink">
                        {ruleDestinationName(rule)} <span className="text-muted">({rule.destinationType})</span>
                      </td>
                      <td className="py-3 text-ink">{ruleValueLabel(rule, currency)}</td>
                      <td className="py-3 text-ink">{formatDateTime(rule.createdAt)}</td>
                      <td className="py-3 font-medium text-ink">
                        {typeof rule.allocatedThisMonth === 'number' ? formatMoney(rule.allocatedThisMonth, currency) : '–'}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggle.mutate(rule)}
                            disabled={toggle.isPending && toggle.variables?.id === rule.id}
                            aria-label={`${rule.status === 'active' ? 'Pause' : 'Resume'} ${rule.name}`}
                            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
                          >
                            {rule.status === 'active' ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setParams({ edit: rule.id })}
                            aria-label={`Edit ${rule.name}`}
                            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
                          >
                            <Pencil aria-hidden="true" className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(rule)}
                            aria-label={`Delete ${rule.name}`}
                            className="grid size-9 place-items-center rounded-lg text-danger hover:bg-danger-soft"
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={d.pagination.pages} total={d.pagination.total} shown={d.data.length} noun="rules" onPage={setPage} />
          </>
        )}
      </QueryView>
      <DeleteRule rule={deleting} onClose={() => setDeleting(null)} />
    </section>
  )
}

function SplitHistory({ currency }: { currency: string }) {
  const [page, setPage] = useState(1)
  const runs = useQuery({ queryKey: runKeys.list(page), queryFn: () => runsApi.list(page), placeholderData: (p) => p })
  return (
    <section aria-labelledby="split-history" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <h2 id="split-history" className="text-base text-ink sm:text-lg">
        Split History
      </h2>
      <QueryView
        query={runs}
        loading={<ListSkeleton label="Loading your split history" rows={3} />}
        errorTitle="We could not load your split history"
        isEmpty={(d) => d.data.length === 0}
        empty={<p className="py-8 text-center text-sm text-muted">No splits have run yet. Your first split runs when your salary arrives.</p>}
      >
        {(d) => (
          <>
            <ul className="flex flex-col gap-2">
              {d.data.map((run) => (
                <li key={run.id}>
                  <Link to={`/split-runs/${run.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4 hover:bg-canvas">
                    <span>
                      <span className="block font-medium text-ink">{formatDateTime(run.createdAt)}</span>
                      <span className="block text-xs text-muted">{run.trigger === 'manual' ? 'Run Now' : 'Automatic split'}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-medium text-ink">
                        {formatMoney(run.baseAmount, currency)}
                      </span>
                      <span className="block text-xs text-muted">{runStatusLabel(run.status)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={d.pagination.pages} total={d.pagination.total} shown={d.data.length} noun="splits" onPage={setPage} />
          </>
        )}
      </QueryView>
    </section>
  )
}

function EditRuleModal({ ruleId, currency, onClose }: { ruleId: string; currency: string; onClose: () => void }) {
  const rule = useQuery({ queryKey: ruleKeys.detail(ruleId), queryFn: () => rulesApi.get(ruleId) })
  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title="Reconfigure Split Rule">
      <QueryView query={rule} loading={<FormSkeleton label="Loading this rule" fields={5} />} errorTitle="We could not load this rule">
        {(data) => <RuleForm currency={currency} rule={data} onSaved={onClose} />}
      </QueryView>
    </Modal>
  )
}

export function SplitRulesPage() {
  usePageTitle('Split Rules')
  const currency = useAccountCurrency()
  const [params, setParams] = useSearchParams()
  const summary = useQuery({ queryKey: ruleKeys.summary, queryFn: rulesApi.summary })
  const creating = params.get('create') === '1'
  const editId = params.get('edit')
  const presetType = params.get('destinationType')
  const presetId = params.get('destinationId')
  const preset =
    (presetType === 'wallet' || presetType === 'beneficiary') && presetId
      ? { destinationType: presetType as DestinationType, destinationId: presetId }
      : undefined

  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 tabIndex={-1} className="text-2xl leading-8 text-black outline-none">
            Split Rules
          </h1>
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link to="/" className="font-medium text-link hover:underline">
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true" className="text-muted">/</li>
              <li aria-current="page" className="text-muted">
                Split Rules
              </li>
            </ol>
          </nav>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <RunNowButton currency={currency} />
          <Button onClick={() => setParams({ create: '1' })}>
            <Plus aria-hidden="true" className="size-4" />
            Add New Rule
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-5 rounded-[32px] border border-line bg-surface p-3 sm:p-4">
        <QueryView query={summary} errorTitle="We could not load your allocation summary" loading={<SummarySkeleton />}>
          {(data) => <SummaryCard summary={data} currency={currency} />}
        </QueryView>
        <RulesTable currency={currency} />
        <SplitHistory currency={currency} />
      </div>

      <Modal
        open={creating}
        onOpenChange={(open) => !open && setParams({})}
        title="Create Split Rule"
        description="Choose where part of every salary should go."
      >
        <RuleForm currency={currency} preset={preset} onSaved={() => setParams({})} />
      </Modal>
      {editId && <EditRuleModal ruleId={editId} currency={currency} onClose={() => setParams({})} />}
    </>
  )
}
