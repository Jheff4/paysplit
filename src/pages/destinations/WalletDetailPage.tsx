import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react'
import { AlertDialog } from 'radix-ui'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchField } from '@/components/ui/SearchField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { LoadingStatus, QueryView, Skeleton, StatCardSkeleton, TableSkeleton } from '@/components/ui/states'
import { useAccountCurrency } from '@/features/account/useAccountCurrency'
import { LinkedRuleCard } from '@/features/rules/LinkedRuleCard'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { walletKeys, walletsApi, type WalletDetail } from '@/features/wallets/api'
import { MoveFundsDialog } from '@/features/wallets/MoveFundsDialog'
import { TargetBar } from '@/features/wallets/WalletCard'
import { WalletForm } from '@/features/wallets/WalletForm'
import { formatMoney } from '@/lib/money'
import { DestinationsHeader } from './DestinationsHeader'

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex min-h-[140px] flex-col justify-between rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-surface p-5 shadow-xs">
      <p className="text-sm text-ink">{label}</p>
      <p className="text-2xl font-medium tracking-tight text-ink">{value}</p>
      <p className="text-xs text-muted">{note}</p>
    </div>
  )
}

function History({ walletId, currency }: { walletId: string; currency: string }) {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'allocated' | 'moved'>('all')
  const [search, setSearch] = useState('')
  const q = useDeferredValue(search.trim())
  const history = useQuery({
    queryKey: walletKeys.transactions(walletId, page, filter, q),
    queryFn: () => walletsApi.transactions(walletId, page, filter, q),
    placeholderData: (prev) => prev,
  })
  return (
    <section aria-labelledby="wallet-history" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="wallet-history" className="text-base text-ink sm:text-lg">
          Wallet Transaction History
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <SearchField label="Search this wallet's history" value={search} onChange={(v) => (setSearch(v), setPage(1))} />
          <SegmentedControl
            hideLabel
            label="Show"
            value={filter}
            onChange={(v) => (setFilter(v), setPage(1))}
            options={[
              { value: 'all', label: 'All' },
              { value: 'allocated', label: 'Allocated' },
              { value: 'moved', label: 'Moved' },
            ]}
          />
        </div>
      </div>
      <QueryView
        query={history}
        loading={<TableSkeleton label="Loading this wallet's history" columns={7} />}
        errorTitle="We could not load this wallet's history"
        isEmpty={(d) => d.data.length === 0}
        empty={<p className="py-8 text-center text-sm text-muted">{q ? 'No matching transactions.' : 'No money has moved in or out of this wallet yet.'}</p>}
      >
        {(d) => (
          <>
            <TransactionTable rows={d.data} currency={currency} caption="Wallet transactions" />
            <Pagination page={page} pages={d.pagination.pages} total={d.pagination.total} shown={d.data.length} noun="transactions" onPage={setPage} />
          </>
        )}
      </QueryView>
    </section>
  )
}

function DeleteWallet({ wallet }: { wallet: WalletDetail }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hasMoney = wallet.balance > 0
  const remove = useMutation({
    mutationFn: () => walletsApi.remove(wallet.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/destinations?tab=wallets', { replace: true })
    },
  })
  return (
    <AlertDialog.Root onOpenChange={(open) => !open && remove.reset()}>
      <AlertDialog.Trigger asChild>
        <Button variant="ghost" className="text-danger hover:bg-danger-soft">
          <Trash2 aria-hidden="true" className="size-4" />
          Delete
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-surface p-6 shadow-modal">
          <AlertDialog.Title className="text-lg font-semibold text-heading">Delete {wallet.name}?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">
            {hasMoney
              ? 'This wallet still holds money. Move it to your salary account first, then you can delete the wallet.'
              : 'Its split rule is deleted too. Past transactions stay in your history.'}
          </AlertDialog.Description>
          {remove.isError && (
            <Alert tone="error" live className="mt-4">
              {remove.error instanceof ApiError && remove.error.code === 'WALLET_NOT_EMPTY'
                ? 'This wallet still holds money or has a pending movement. Move the money out first.'
                : errorMessage(remove.error)}
            </Alert>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" className="flex-1">
                {hasMoney ? 'OK' : 'Keep'}
              </Button>
            </AlertDialog.Cancel>
            {!hasMoney && (
              <Button variant="danger" className="flex-1" loading={remove.isPending} onClick={() => remove.mutate()}>
                Delete wallet
              </Button>
            )}
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

function WalletDetailSkeleton() {
  return (
    <LoadingStatus label="Loading this wallet" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-24 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-11 w-24 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-32 rounded-[20px]" />
      <Skeleton className="h-72 rounded-[20px]" />
    </LoadingStatus>
  )
}

function WalletDetailView({ wallet, currency }: { wallet: WalletDetail; currency: string }) {
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)
  const cur = wallet.currency ?? currency
  const money = (minor: number) => formatMoney(minor, cur, undefined, { trimZeroMinor: true })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/destinations?tab=wallets" className="inline-flex min-h-10 items-center gap-2 text-lg text-ink">
          <ArrowLeft aria-hidden="true" className="size-5" />
          <span>{wallet.name}</span>
          <span className="sr-only">, back to wallets</span>
        </Link>
        <div className="flex flex-wrap gap-2">
          <DeleteWallet wallet={wallet} />
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" className="size-4" />
            Edit Wallet
          </Button>
          <Button onClick={() => setMoving(true)}>
            <ArrowUpRight aria-hidden="true" className="size-4" />
            Move
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Available Balance" value={money(wallet.stats.availableBalance)} note="Available in wallet" />
        <Stat label="Total Allocated" value={money(wallet.stats.totalAllocated)} note="Received from salary splits" />
        <Stat label="Total Moved Back" value={money(wallet.stats.totalMovedBack)} note="Moved back to your salary account" />
        <div className="flex min-h-[140px] flex-col justify-between rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-surface p-5 shadow-xs">
          <p className="text-sm text-ink">Goal Progress</p>
          <TargetBar balance={wallet.balance} target={wallet.targetAmount} currency={cur} serverPercent={wallet.progressPercent} />
          <p className="text-xs text-muted">A target never locks your money.</p>
        </div>
      </div>

      <LinkedRuleCard
        rule={wallet.linkedRule}
        currency={cur}
        createHref={`/split-rules?create=1&destinationType=wallet&destinationId=${encodeURIComponent(wallet.id)}`}
      />
      <History walletId={wallet.id} currency={cur} />

      <Modal open={editing} onOpenChange={setEditing} title="Edit Wallet">
        <WalletForm currency={cur} wallet={wallet} showRuleAction={false} onSaved={() => setEditing(false)} />
      </Modal>
      <MoveFundsDialog wallet={wallet} currency={cur} open={moving} onOpenChange={setMoving} />
    </div>
  )
}

export function WalletDetailPage() {
  const { walletId = '' } = useParams()
  const currency = useAccountCurrency()
  const wallet = useQuery({ queryKey: walletKeys.detail(walletId), queryFn: () => walletsApi.get(walletId) })

  return (
    <>
      <DestinationsHeader current={wallet.data?.name ?? 'Wallet'} />
      <QueryView query={wallet} loading={<WalletDetailSkeleton />} errorTitle="We could not load this wallet">
        {(data) => <WalletDetailView wallet={data} currency={currency} />}
      </QueryView>
    </>
  )
}
