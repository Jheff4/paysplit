import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import type { DashboardSummary } from '@/api/types'
import { formatMoney } from '@/lib/money'

function Ring({ wallets, beneficiaries, remaining }: { wallets: number; beneficiaries: number; remaining: number }) {
  const total = wallets + beneficiaries + remaining
  const radius = 80
  const c = 2 * Math.PI * radius
  const share = (v: number) => (total > 0 ? (v / total) * c : 0)
  const segments = [
    { value: share(wallets), className: 'stroke-brand' },
    { value: share(beneficiaries), className: 'stroke-ink' },
  ]
  let offset = 0
  return (
    <svg viewBox="0 0 200 200" className="size-full" aria-hidden="true">
      <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="14" className="stroke-line" />
      {segments.map((s, i) => {
        const el = (
          <circle
            key={i}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="14"
            strokeDasharray={`${s.value} ${c - s.value}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 100 100)"
            className={s.className}
          />
        )
        offset += s.value
        return el
      })}
    </svg>
  )
}

export function PartitionCard({ summary }: { summary: DashboardSummary }) {
  const { partition } = summary
  const currency = summary.salaryAccount.currency
  const money = (minor: number) => formatMoney(minor, currency, undefined, { trimZeroMinor: true })

  return (
    <section aria-labelledby="partition-heading" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 id="partition-heading" className="text-base text-ink sm:text-lg">
          Salary Partition
        </h2>
        <Link to="/split-rules" className="inline-flex min-h-10 items-center gap-1 text-sm text-link hover:underline">
          See rules <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[220px]">
        <Ring wallets={partition.toWallets} beneficiaries={partition.toBeneficiaries} remaining={partition.remaining} />
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-muted">Salary Remaining</p>
            <p className="text-2xl font-semibold text-ink">{money(partition.remaining)}</p>
            <p className="text-xs font-medium text-success">{partition.remainingPercent}% left</p>
          </div>
        </div>
      </div>
      {partition.baselineSalary === null && (
        <p className="text-center text-sm text-muted">
          <Link to="/setup" className="font-medium text-link underline underline-offset-4">
            Add your monthly salary
          </Link>{' '}
          to see how it is split.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/destinations?tab=wallets" className="flex items-center justify-between gap-2 border-l-4 border-brand pl-3">
          <span>
            <span className="block font-medium text-ink">{money(partition.toWallets)}</span>
            <span className="block text-xs text-muted">Wallets</span>
          </span>
          <ChevronRight aria-hidden="true" className="size-4 text-muted" />
        </Link>
        <Link to="/destinations?tab=beneficiaries" className="flex items-center justify-between gap-2 border-l-4 border-ink pl-3">
          <span>
            <span className="block font-medium text-ink">{money(partition.toBeneficiaries)}</span>
            <span className="block text-xs text-muted">Beneficiaries</span>
          </span>
          <ChevronRight aria-hidden="true" className="size-4 text-muted" />
        </Link>
      </div>
    </section>
  )
}
