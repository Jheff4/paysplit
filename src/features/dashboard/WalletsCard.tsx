import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Wallet as WalletIcon } from 'lucide-react'
import { Link } from 'react-router'
import { ErrorState, LoadingBlock } from '@/components/ui/states'
import { formatMoney } from '@/lib/money'
import { accentHex, walletKeys, walletsApi } from '@/features/wallets/api'

export function WalletsCard({ currency }: { currency: string }) {
  const wallets = useQuery({ queryKey: walletKeys.all, queryFn: walletsApi.list })

  return (
    <section aria-labelledby="wallets-heading" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 id="wallets-heading" className="text-base text-ink sm:text-lg">
          Wallets
        </h2>
        <Link to="/destinations?tab=wallets" aria-label="All wallets" className="grid size-10 place-items-center rounded-lg hover:bg-canvas">
          <ChevronRight aria-hidden="true" className="size-5" />
        </Link>
      </div>
      {wallets.isPending ? (
        <LoadingBlock label="Loading wallets" rows={2} />
      ) : wallets.isError ? (
        <ErrorState error={wallets.error} title="We could not load your wallets" onRetry={() => void wallets.refetch()} />
      ) : wallets.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <p className="font-semibold text-ink">No wallet yet</p>
          <p className="text-sm text-muted">You have no wallet to display yet. Create a wallet to start saving.</p>
          <Link
            to="/destinations?create=wallet"
            className="mt-2 inline-flex min-h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover"
          >
            Create Wallet
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {wallets.data.slice(0, 4).map((w) => {
            const hex = accentHex(w.accentColor)
            return (
              <li key={w.id}>
                <Link
                  to={`/destinations/wallets/${w.id}`}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ backgroundColor: `${hex}1a` }}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg text-white" style={{ backgroundColor: hex }}>
                    <WalletIcon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{w.name}</span>
                    {w.category && <span className="block text-xs text-muted">{w.category.name}</span>}
                  </span>
                  <span className="font-medium text-ink">
                    {formatMoney(w.balance, w.currency ?? currency, undefined, { trimZeroMinor: true })}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
