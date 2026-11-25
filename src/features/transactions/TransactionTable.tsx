import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import type { Transaction } from '@/api/types'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/dates'
import { signedMoney, txTitle } from './format'
import { StatusBadge } from './StatusBadge'

export function TransactionTable({
  rows,
  currency,
  caption,
  compact = false,
}: {
  rows: Transaction[]
  currency: string
  caption: string
  compact?: boolean
}) {
  return (
    <>
      <table className={cn('hidden w-full text-left text-sm', !compact && 'md:table')}>
        <caption className="sr-only">{caption}</caption>
        <thead className="text-xs text-muted">
          <tr className="border-b border-line">
            <th scope="col" className="py-3 font-normal">Reference</th>
            <th scope="col" className="py-3 font-normal">Destination</th>
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
              <td className="py-3 font-mono text-xs text-ink">{tx.reference}</td>
              <td className="py-3 text-ink">{txTitle(tx)}</td>
              <td className="py-3">
                {tx.category && <span className="rounded-lg border border-line px-2.5 py-1 text-xs">{tx.category.name}</span>}
              </td>
              <td className="py-3 text-ink">{formatDateTime(tx.createdAt)}</td>
              <td className="py-3">
                <StatusBadge status={tx.status} />
              </td>
              <td className={cn('py-3 text-right font-medium', (tx.signedAmount ?? tx.amount) < 0 ? 'text-ink' : 'text-success')}>
                {signedMoney(tx, currency)}
              </td>
              <td className="py-3 text-right">
                <Link
                  to={`/transactions/${tx.id}`}
                  aria-label={`Details for ${tx.reference}`}
                  className="inline-grid size-9 place-items-center rounded-lg hover:bg-canvas"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className={cn('flex flex-col gap-2', !compact && 'md:hidden')} aria-label={caption}>
        {rows.map((tx) => (
          <li key={tx.id}>
            <Link to={`/transactions/${tx.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{txTitle(tx)}</span>
                <span className="block text-xs text-muted">{formatDateTime(tx.createdAt)}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className={cn('text-sm font-medium', (tx.signedAmount ?? tx.amount) < 0 ? 'text-ink' : 'text-success')}>
                  {signedMoney(tx, currency)}
                </span>
                <StatusBadge status={tx.status} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
