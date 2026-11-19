import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErrorState, Skeleton } from '@/components/ui/states'
import { cn } from '@/lib/cn'
import { formatPeriod, isoDateInZone } from '@/lib/dates'
import { formatMoney, formatMoneyCompact } from '@/lib/money'
import { dashboardApi, dashboardKeys } from './api'

type RangeKey = 'default' | '30d' | 'month'

function rangeFor(key: RangeKey, now = new Date()): { from?: string; to?: string } {
  if (key === 'default') return {}
  const to = isoDateInZone(now)
  if (key === 'month') return { from: `${to.slice(0, 8)}01`, to }
  const [y, m, d] = to.split('-').map(Number) as [number, number, number]
  const start = new Date(Date.UTC(y, m - 1, d - 29))
  return { from: start.toISOString().slice(0, 10), to }
}

function label(period: string) {
  if (/^\d{4}-\d{2}$/.test(period)) return formatPeriod(period)
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return period.slice(8)
  return period
}

export function CashFlowCard({ currency }: { currency: string }) {
  const [range, setRange] = useState<RangeKey>('default')
  const { from, to } = rangeFor(range)
  const flow = useQuery({ queryKey: dashboardKeys.cashFlow(from, to), queryFn: () => dashboardApi.cashFlow(from, to) })

  const data = (flow.data?.buckets ?? []).map((b) => ({
    label: label(b.period),
    wallets: b.toWallets,
    beneficiaries: -b.toBeneficiaries,
  }))
  const change = flow.data?.monthOverMonth.changePercent
  const empty = !!flow.data && flow.data.totals.toWallets === 0 && flow.data.totals.toBeneficiaries === 0

  return (
    <section aria-labelledby="cashflow-heading" className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="cashflow-heading" className="text-base text-ink sm:text-lg">
            Salary Allocation & Split Cash Flow
          </h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-medium tracking-tight text-ink">
              {flow.data ? formatMoney(flow.data.totals.inflow, currency, undefined, { trimZeroMinor: true }) : '–'}
            </span>
            {change !== null && change !== undefined && (
              <span className="text-xs text-muted">
                <span className={cn('font-medium', change >= 0 ? 'text-success' : 'text-danger')}>
                  {change >= 0 ? '+' : ''}
                  {change}%
                </span>{' '}
                from last month
              </span>
            )}
          </p>
          <p className="text-xs text-muted">Salary received in this period</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ul className="flex gap-4 text-sm text-ink" aria-label="Chart legend">
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2 rounded-full bg-brand" /> Wallets
            </li>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2 rounded-full bg-ink" /> Beneficiaries
            </li>
          </ul>
          <label className="sr-only" htmlFor="cashflow-range">
            Period
          </label>
          <select
            id="cashflow-range"
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="min-h-10 rounded-xl border border-field bg-surface px-3 text-sm"
          >
            <option value="default">Last 9 months</option>
            <option value="30d">Last 30 days</option>
            <option value="month">This month</option>
          </select>
        </div>
      </div>

      {flow.isPending ? (
        <Skeleton className="h-72 w-full" />
      ) : flow.isError ? (
        <ErrorState error={flow.error} title="We could not load your cash flow" onRetry={() => void flow.refetch()} />
      ) : (
        <>
          <div aria-hidden="true" className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} stackOffset="sign" accessibilityLayer={false} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid vertical={false} stroke="#ececec" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#475467', fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={empty ? false : { fill: '#475467', fontSize: 12 }}
                  tickFormatter={(v: number) => formatMoneyCompact(v, currency)}
                />
                <ReferenceLine y={0} stroke="#7c7c7c" strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ fill: 'rgb(51 167 245 / 0.08)' }}
                  formatter={(value, name) => [formatMoney(Math.abs(Number(value)), currency), name === 'wallets' ? 'To wallets' : 'To beneficiaries']}
                />
                <Bar dataKey="wallets" stackId="flow" fill="#33a7f5" radius={[8, 8, 0, 0]} maxBarSize={56} />
                <Bar dataKey="beneficiaries" stackId="flow" fill="#171918" radius={[0, 0, 8, 8]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {empty && (
            <p className="text-center text-sm text-muted">No money has been split in this period yet.</p>
          )}
          <table className="sr-only">
            <caption>Money split per period</caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Salary in</th>
                <th scope="col">To wallets</th>
                <th scope="col">To beneficiaries</th>
              </tr>
            </thead>
            <tbody>
              {(flow.data?.buckets ?? []).map((b) => (
                <tr key={b.period}>
                  <th scope="row">{label(b.period)}</th>
                  <td>{formatMoney(b.inflow, currency)}</td>
                  <td>{formatMoney(b.toWallets, currency)}</td>
                  <td>{formatMoney(b.toBeneficiaries, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
