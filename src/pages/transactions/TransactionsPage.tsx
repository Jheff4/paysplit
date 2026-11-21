import { useMutation, useQuery } from '@tanstack/react-query'
import { Download, Printer, ReceiptText } from 'lucide-react'
import { useDeferredValue, useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { SearchField } from '@/components/ui/SearchField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState, QueryView, TableSkeleton } from '@/components/ui/states'
import { useAccountCurrency } from '@/features/account/useAccountCurrency'
import { downloadText, transactionKeys, transactionsApi, type TransactionFilters } from '@/features/transactions/api'
import { dateRangeProblem, EMPTY_FILTERS, statementFilename } from '@/features/transactions/filters'
import { TransactionSheet } from '@/features/transactions/TransactionSheet'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { isoDateInZone } from '@/lib/dates'
import { usePageTitle } from '@/lib/usePageTitle'

function DateInput({ label, value, max, onChange }: { label: string; value: string; max: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-label">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-xl border border-field bg-surface px-3 text-sm"
      />
    </div>
  )
}

export function TransactionsPage() {
  usePageTitle('Transactions')
  const currency = useAccountCurrency()
  const navigate = useNavigate()
  const { transactionId } = useParams()
  const today = isoDateInZone(new Date())
  const statusId = useId()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS)
  const search = useDeferredValue(filters.search.trim())
  const rangeProblem = dateRangeProblem(filters.from, filters.to, today)
  const applied = { ...filters, search, ...(rangeProblem ? { from: '', to: '' } : {}) }

  const list = useQuery({
    queryKey: transactionKeys.list(page, applied),
    queryFn: () => transactionsApi.list(page, applied),
    placeholderData: (prev) => prev,
  })
  const exportCsv = useMutation({
    mutationFn: () => transactionsApi.exportCsv(applied),
    onSuccess: (csv) => downloadText(csv, statementFilename(applied, today)),
  })
  const update = (patch: Partial<TransactionFilters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }
  const filtered = applied.type !== 'all' || applied.status || applied.search || applied.from || applied.to

  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 tabIndex={-1} className="text-2xl leading-8 text-black outline-none">
            Transactions
          </h1>
          <nav aria-label="Breadcrumb" className="print:hidden">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link to="/" className="font-medium text-link hover:underline">
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true" className="text-muted">/</li>
              <li aria-current="page" className="text-muted">
                Transactions
              </li>
            </ol>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer aria-hidden="true" className="size-4" />
            Print statement
          </Button>
          <Button loading={exportCsv.isPending} onClick={() => exportCsv.mutate()}>
            <Download aria-hidden="true" className="size-4" />
            Export Statement CSV
          </Button>
        </div>
      </header>
      {exportCsv.isError && (
        <Alert tone="error" live className="mb-4">
          We could not create your statement: {errorMessage(exportCsv.error)}
        </Alert>
      )}
      {exportCsv.isSuccess && (
        <Alert tone="success" live className="mb-4 print:hidden">
          Statement downloaded. It uses the filters below and includes up to 5,000 transactions.
        </Alert>
      )}

      <section aria-labelledby="tx-history" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="tx-history" className="text-base text-ink sm:text-lg">
            Transaction & Splits History
          </h2>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <SearchField label="Search by reference, destination or narration" value={filters.search} onChange={(v) => update({ search: v })} />
            <SegmentedControl
              hideLabel
              label="Type"
              value={filters.type}
              onChange={(v) => update({ type: v })}
              options={[
                { value: 'all', label: 'All' },
                { value: 'salary', label: 'Salary' },
                { value: 'wallet', label: 'Wallet' },
                { value: 'beneficiary', label: 'Beneficiary' },
              ]}
            />
          </div>
        </div>
        <fieldset className="flex flex-wrap items-end gap-3 print:hidden">
          <legend className="sr-only">More filters</legend>
          <div className="flex flex-col gap-1">
            <label htmlFor={statusId} className="text-xs font-medium text-label">
              Status
            </label>
            <select
              id={statusId}
              value={filters.status}
              onChange={(e) => update({ status: e.target.value as TransactionFilters['status'] })}
              className="min-h-10 rounded-xl border border-field bg-surface px-3 text-sm"
            >
              <option value="">Any status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
          <DateInput label="From" value={filters.from} max={today} onChange={(v) => update({ from: v })} />
          <DateInput label="To" value={filters.to} max={today} onChange={(v) => update({ to: v })} />
          <p className="pb-2 text-xs text-muted">Dates are in Lagos time (WAT) and include both days.</p>
          {filtered && (
            <Button variant="ghost" size="sm" onClick={() => (setFilters(EMPTY_FILTERS), setPage(1))}>
              Clear filters
            </Button>
          )}
        </fieldset>
        {rangeProblem && (
          <p role="alert" className="text-sm text-danger">
            {rangeProblem} The date filter is not applied until this is fixed.
          </p>
        )}

        <QueryView
          query={list}
          loading={<TableSkeleton label="Loading your transactions" columns={7} rows={8} />}
          errorTitle="We could not load your transactions"
          isEmpty={(d) => d.data.length === 0}
          empty={
            filtered ? (
              <p className="py-8 text-center text-sm text-muted">No transactions match these filters.</p>
            ) : (
              <EmptyState
                icon={<ReceiptText aria-hidden="true" className="size-8" />}
                title="No transactions yet"
                description="Your salary, splits, transfers and wallet moves will all appear here."
              />
            )
          }
        >
          {(d) => (
            <>
              <TransactionTable rows={d.data} currency={currency} caption="Transactions" />
              <div className="print:hidden">
                <Pagination page={page} pages={d.pagination.pages} total={d.pagination.total} shown={d.data.length} noun="activity entries" onPage={setPage} />
              </div>
            </>
          )}
        </QueryView>
      </section>

      {transactionId && <TransactionSheet id={transactionId} currency={currency} onClose={() => navigate('/transactions')} />}
    </>
  )
}
