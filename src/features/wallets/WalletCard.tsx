import { ArrowRight, Wallet as WalletIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import type { Wallet } from './api'
import { targetPercent } from './target'

export function TargetBar({
  balance,
  target,
  currency,
  serverPercent,
}: {
  balance: number
  target: number | null | undefined
  currency: string
  serverPercent?: number | null
}) {
  const percent = typeof serverPercent === 'number' && target ? Math.min(100, Math.max(0, serverPercent)) : targetPercent(balance, target)
  if (percent === null || !target) return <p className="text-xs text-muted">No target set</p>
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-muted">
        <span>Target: {formatMoney(target, currency, undefined, { trimZeroMinor: true })}</span>
        <span className="font-medium text-ink">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Progress to target"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 overflow-hidden rounded-full bg-surface/80 ring-1 ring-line"
      >
        <div className="h-full rounded-full bg-ink" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function WalletCard({ wallet, currency }: { wallet: Wallet; currency: string }) {
  const hex = wallet.accentHex
  const cur = wallet.currency ?? currency
  return (
    <li className="flex flex-col gap-5 rounded-[20px] p-5" style={{ backgroundColor: `${hex}1a` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: hex }}>
            <WalletIcon aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-medium text-ink">{wallet.name}</h3>
            {wallet.category && <p className="text-xs text-muted">{wallet.category.name}</p>}
          </div>
        </div>
        <p className="text-lg font-semibold text-ink">{formatMoney(wallet.balance, cur, undefined, { trimZeroMinor: true })}</p>
      </div>
      <TargetBar balance={wallet.balance} target={wallet.targetAmount} currency={cur} serverPercent={wallet.progressPercent} />
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{wallet.createdAt ? `Created: ${formatDate(wallet.createdAt)}` : ''}</span>
        <Link to={`/destinations/wallets/${wallet.id}`} className="inline-flex min-h-9 items-center gap-1 font-medium text-ink hover:underline">
          View wallet <span className="sr-only">{wallet.name}</span>
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
    </li>
  )
}
