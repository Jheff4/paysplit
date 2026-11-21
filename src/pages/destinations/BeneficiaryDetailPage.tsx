import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchField } from '@/components/ui/SearchField'
import { LoadingStatus, QueryView, Skeleton, StatCardSkeleton, TableSkeleton } from '@/components/ui/states'
import { useAccountCurrency } from '@/features/account/useAccountCurrency'
import { beneficiariesApi, beneficiaryKeys, maskAccountNumber, type BeneficiaryDetail } from '@/features/beneficiaries/api'
import { BeneficiaryForm } from '@/features/beneficiaries/BeneficiaryForm'
import { DeleteBeneficiaryDialog } from '@/features/beneficiaries/DeleteBeneficiaryDialog'
import { LinkedRuleCard } from '@/features/rules/LinkedRuleCard'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { formatDate } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import { DestinationsHeader } from './DestinationsHeader'

function Transfers({ id, currency }: { id: string; currency: string }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const q = useDeferredValue(search.trim())
  const transfers = useQuery({
    queryKey: beneficiaryKeys.transactions(id, page, q),
    queryFn: () => beneficiariesApi.transactions(id, page, q),
    placeholderData: (prev) => prev,
  })
  return (
    <section aria-labelledby="transfer-history" className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="transfer-history" className="text-base text-ink sm:text-lg">
          Transfer History
        </h2>
        <SearchField label="Search transfers" value={search} onChange={(v) => (setSearch(v), setPage(1))} />
      </div>
      <QueryView
        query={transfers}
        loading={<TableSkeleton label="Loading transfers" columns={7} />}
        errorTitle="We could not load transfers"
        isEmpty={(d) => d.data.length === 0}
        empty={<p className="py-8 text-center text-sm text-muted">{q ? 'No matching transfers.' : 'No transfers to this beneficiary yet.'}</p>}
      >
        {(d) => (
          <>
            <TransactionTable rows={d.data} currency={currency} caption="Transfers" />
            <Pagination page={page} pages={d.pagination.pages} total={d.pagination.total} shown={d.data.length} noun="transfers" onPage={setPage} />
          </>
        )}
      </QueryView>
    </section>
  )
}

function BeneficiaryDetailSkeleton() {
  return (
    <LoadingStatus label="Loading this beneficiary" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-24 rounded-xl" />
          <Skeleton className="h-11 w-24 rounded-xl" />
          <Skeleton className="h-11 w-28 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <StatCardSkeleton />
          <Skeleton className="h-56 rounded-[20px]" />
        </div>
        <Skeleton className="h-80 rounded-[20px]" />
      </div>
    </LoadingStatus>
  )
}

function BeneficiaryView({ beneficiary, currency }: { beneficiary: BeneficiaryDetail; currency: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [deleting, setDeleting] = useState(false)
  const editing = params.get('edit') === '1'
  const paused = beneficiary.status === 'paused'
  const totalAllocated = beneficiary.stats?.totalAllocated ?? beneficiary.totalAllocated ?? 0

  const toggle = useMutation({
    mutationFn: () => beneficiariesApi.update(beneficiary.id, { status: paused ? 'active' : 'paused' }),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] }),
      queryClient.invalidateQueries({ queryKey: ['split-rules'] }),
    ]),
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/destinations?tab=beneficiaries" className="inline-flex min-h-10 items-center gap-2 text-lg text-ink">
          <ArrowLeft aria-hidden="true" className="size-5" />
          <span>{beneficiary.accountName}</span>
          <span className="sr-only">, back to beneficiaries</span>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setDeleting(true)}>
            <Trash2 aria-hidden="true" className="size-4" />
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setParams({ edit: '1' })}>
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </Button>
          <Button variant="secondary" loading={toggle.isPending} onClick={() => toggle.mutate()}>
            {paused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
            {paused ? 'Resume transfers' : 'Pause transfers'}
          </Button>
        </div>
      </div>
      {toggle.isError && (
        <Alert tone="error" live>
          {errorMessage(toggle.error)}
        </Alert>
      )}
      {paused && (
        <Alert tone="warning" title="Transfers are paused">
          Splits skip this beneficiary until you resume. No money leaves for them while paused.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex min-h-[140px] flex-col justify-between rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-surface p-5 shadow-xs">
            <p className="text-sm text-ink">Total Allocated</p>
            <p className="text-2xl font-medium text-ink">{formatMoney(totalAllocated, currency, undefined, { trimZeroMinor: true })}</p>
            <p className="text-xs text-muted">Sent from salary splits</p>
          </div>
          <LinkedRuleCard
            rule={beneficiary.linkedRule ?? beneficiary.rule}
            currency={currency}
            createHref={`/split-rules?create=1&destinationType=beneficiary&destinationId=${encodeURIComponent(beneficiary.id)}`}
          />
          <dl className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-5 text-sm">
            <div>
              <dt className="text-xs text-muted">Account Number</dt>
              <dd className="text-2xl font-medium tracking-wide text-ink">{maskAccountNumber(beneficiary)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Account Name</dt>
              <dd className="text-ink">{beneficiary.accountName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Bank Name</dt>
              <dd className="text-ink">{beneficiary.bankName}</dd>
            </div>
            {beneficiary.category && (
              <div>
                <dt className="text-xs text-muted">Category</dt>
                <dd className="text-ink">{beneficiary.category.name}</dd>
              </div>
            )}
            {beneficiary.narration && (
              <div>
                <dt className="text-xs text-muted">Narration</dt>
                <dd className="text-ink">{beneficiary.narration}</dd>
              </div>
            )}
            {beneficiary.createdAt && (
              <div>
                <dt className="text-xs text-muted">Date added</dt>
                <dd className="text-ink">{formatDate(beneficiary.createdAt)}</dd>
              </div>
            )}
          </dl>
        </div>
        <Transfers id={beneficiary.id} currency={currency} />
      </div>

      <Modal open={editing} onOpenChange={(open) => !open && setParams({})} title="Edit Beneficiary">
        <BeneficiaryForm beneficiary={beneficiary} showRuleAction={false} onSaved={() => setParams({})} />
      </Modal>
      <DeleteBeneficiaryDialog
        beneficiary={deleting ? beneficiary : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate('/destinations?tab=beneficiaries', { replace: true })}
      />
    </div>
  )
}

export function BeneficiaryDetailPage() {
  const { beneficiaryId = '' } = useParams()
  const currency = useAccountCurrency()
  const beneficiary = useQuery({ queryKey: beneficiaryKeys.detail(beneficiaryId), queryFn: () => beneficiariesApi.get(beneficiaryId) })
  return (
    <>
      <DestinationsHeader current={beneficiary.data?.accountName ?? 'Beneficiary'} />
      <QueryView query={beneficiary} loading={<BeneficiaryDetailSkeleton />} errorTitle="We could not load this beneficiary">
        {(data) => <BeneficiaryView beneficiary={data} currency={currency} />}
      </QueryView>
    </>
  )
}
