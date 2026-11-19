import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'
import type { Transaction } from '@/api/types'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ErrorState, LoadingBlock } from '@/components/ui/states'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import { StatusBadge } from '@/features/transactions/StatusBadge'
import { dashboardApi } from './api'

type Tab = 'all' | 'wallet' | 'beneficiary'

function signed(tx: Transaction, fallbackCurrency: string) {
  const currency = tx.currency ?? fallbackCurrency
  const value = formatMoney(Math.abs(tx.signedAmount), currency)
  return tx.signedAmount < 0 ? `-${value}` : `+${value}`
}

function title(tx: Transaction) {
  return tx.destinationName ?? tx.description ?? tx.narration ?? tx.reference
}

export function RecentActivity({ currency }: { currency: string }) {
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const list = useQuery({
    queryKey: ['transactions', 'recent', tab, deferredSearch],
    queryFn: () => dashboardApi.recentTransactions(tab, deferredSearch),
    placeholderData: (previous) => previous,
  })
  const rows = list.data?.data ?? []

  return (
    <section aria-labelledby="activity-heading" className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="activity-heading" className="text-base text-ink sm:text-lg">
          Recent Activity & Splits
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-field px-3">
            <Search aria-hidden="true" className="size-4 text-muted" />
            <span className="sr-only">Search activity</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-32 bg-transparent text-sm outline-none placeholder:text-placeholder"
            />
          </label>
          <SegmentedControl
            hideLabel
            label="Show"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: 'All Transactions' },
              { value: 'wallet', label: 'Wallets' },
              { value: 'beneficiary', label: 'Beneficiaries' },
            ]}
          />
        </div>
      </div>

      {list.isPending ? (
        <LoadingBlock label="Loading recent activity" rows={2} />
      ) : list.isError ? (
        <ErrorState error={list.error} title="We could not load your activity" onRetry={() => void list.refetch()} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-line px-6 py-10 text-center">
          <p className="font-semibold text-ink">{deferredSearch ? 'No matching activity' : 'No activity yet'}</p>
          <p className="text-sm text-muted">
            {deferredSearch ? 'Try a different search.' : 'Activities will be displayed here.'}
          </p>
        </div>
      ) : (
        <>
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-3 font-normal">Destination / Rule</th>
                <th scope="col" className="py-3 font-normal">Category</th>
                <th scope="col" className="py-3 font-normal">Date</th>
                <th scope="col" className="py-3 font-normal">Status</th>
                <th scope="col" className="py-3 text-right font-normal">Amount</th>
                <th scope="col" className="w-10 py-3">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => (
                <tr key={tx.id} className="border-b border-line last:border-0">
                  <td className="py-3 text-ink">{title(tx)}</td>
                  <td className="py-3">
                    {tx.category && <span className="rounded-lg border border-line px-2.5 py-1 text-xs">{tx.category}</span>}
                  </td>
                  <td className="py-3 text-ink">{formatDate(tx.createdAt)}</td>
                  <td className="py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className={cn('py-3 text-right font-medium', tx.signedAmount < 0 ? 'text-ink' : 'text-success')}>
                    {signed(tx, currency)}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      to={`/transactions/${tx.id}`}
                      aria-label={`Details for ${title(tx)}`}
                      className="inline-grid size-9 place-items-center rounded-lg hover:bg-canvas"
                    >
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="flex flex-col gap-2 md:hidden">
            {rows.map((tx) => (
              <li key={tx.id}>
                <Link to={`/transactions/${tx.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{title(tx)}</span>
                    <span className="block text-xs text-muted">{formatDate(tx.createdAt)}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cn('text-sm font-medium', tx.signedAmount < 0 ? 'text-ink' : 'text-success')}>
                      {signed(tx, currency)}
                    </span>
                    <StatusBadge status={tx.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">
          {list.data ? `Showing ${rows.length} of ${list.data.pagination.total} activity entries` : ''}
        </span>
        <Link to="/transactions" className="inline-flex min-h-10 items-center gap-1 text-link hover:underline">
          View Full Ledger <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  )
}
