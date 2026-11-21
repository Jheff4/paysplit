import { useQuery } from '@tanstack/react-query'
import { Eye, Pencil, Plus, Trash2, Users, Wallet as WalletIcon } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchField } from '@/components/ui/SearchField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { CardGridSkeleton, EmptyState, QueryView, TableSkeleton } from '@/components/ui/states'
import { useAccountCurrency } from '@/features/account/useAccountCurrency'
import { beneficiariesApi, beneficiaryKeys, maskAccountNumber, type Beneficiary } from '@/features/beneficiaries/api'
import { BeneficiaryForm } from '@/features/beneficiaries/BeneficiaryForm'
import { DeleteBeneficiaryDialog } from '@/features/beneficiaries/DeleteBeneficiaryDialog'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { walletKeys, walletsApi } from '@/features/wallets/api'
import { WalletCard } from '@/features/wallets/WalletCard'
import { WalletForm, type SaveIntent } from '@/features/wallets/WalletForm'
import { formatDay } from '@/lib/dates'
import { DestinationsHeader } from './DestinationsHeader'

type Tab = 'wallets' | 'beneficiaries'

function ruleLink(type: 'wallet' | 'beneficiary', id: string) {
  return `/split-rules?create=1&destinationType=${type}&destinationId=${encodeURIComponent(id)}`
}

function WalletActivity({ currency }: { currency: string }) {
  const [page, setPage] = useState(1)
  const [direction, setDirection] = useState<'all' | 'in' | 'out'>('all')
  const [search, setSearch] = useState('')
  const q = useDeferredValue(search.trim())
  const activity = useQuery({
    queryKey: walletKeys.activity(page, direction, q),
    queryFn: () => walletsApi.activity(page, direction, q),
    placeholderData: (prev) => prev,
  })

  return (
    <section aria-labelledby="wallet-activity" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="wallet-activity" className="text-base text-ink sm:text-lg">
          All Wallet Activity
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <SearchField label="Search wallet activity" value={search} onChange={(v) => (setSearch(v), setPage(1))} />
          <SegmentedControl
            hideLabel
            label="Direction"
            value={direction}
            onChange={(v) => (setDirection(v), setPage(1))}
            options={[
              { value: 'all', label: 'All' },
              { value: 'in', label: 'Money in' },
              { value: 'out', label: 'Money out' },
            ]}
          />
        </div>
      </div>
      <QueryView
        query={activity}
        loading={<TableSkeleton label="Loading wallet activity" columns={7} />}
        errorTitle="We could not load wallet activity"
        isEmpty={(d) => d.data.length === 0}
        empty={<p className="py-8 text-center text-sm text-muted">{q ? 'No matching activity.' : 'No wallet activity yet. Money appears here after your first split.'}</p>}
      >
        {(d) => (
          <>
            <TransactionTable rows={d.data} currency={currency} caption="Wallet activity" />
            <Pagination page={page} pages={d.pagination.pages} total={d.pagination.total} shown={d.data.length} noun="activity entries" onPage={setPage} />
          </>
        )}
      </QueryView>
    </section>
  )
}

function WalletsTab({ currency }: { currency: string }) {
  const wallets = useQuery({ queryKey: walletKeys.all, queryFn: walletsApi.list })
  return (
    <div className="flex flex-col gap-6">
      <QueryView
        query={wallets}
        loading={<CardGridSkeleton label="Loading your wallets" />}
        errorTitle="We could not load your wallets"
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            icon={<WalletIcon aria-hidden="true" className="size-8" />}
            title="No wallet yet"
            description="Wallets hold the parts of your salary you want to keep for a purpose, like rent or school fees."
            action={
              <Link to="?tab=wallets&create=wallet" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover">
                Create Wallet
              </Link>
            }
          />
        }
      >
        {(list) => (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((w) => (
              <WalletCard key={w.id} wallet={w} currency={currency} />
            ))}
          </ul>
        )}
      </QueryView>
      <WalletActivity currency={currency} />
    </div>
  )
}

function BeneficiariesTab() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'all' | 'active' | 'paused'>('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<Beneficiary | null>(null)
  const q = useDeferredValue(search.trim())
  const list = useQuery({
    queryKey: beneficiaryKeys.list(page, status, q),
    queryFn: () => beneficiariesApi.list(page, status, q),
    placeholderData: (prev) => prev,
  })

  return (
    <section aria-labelledby="all-beneficiaries" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="all-beneficiaries" className="text-base text-ink sm:text-lg">
          All Beneficiaries
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <SearchField label="Search beneficiaries" value={search} onChange={(v) => (setSearch(v), setPage(1))} />
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
      <QueryView
        query={list}
        loading={<TableSkeleton label="Loading your beneficiaries" columns={6} />}
        errorTitle="We could not load your beneficiaries"
        isEmpty={(d) => d.data.length === 0}
        empty={
          q || status !== 'all' ? (
            <p className="py-8 text-center text-sm text-muted">No beneficiaries match.</p>
          ) : (
            <EmptyState
              icon={<Users aria-hidden="true" className="size-8" />}
              title="No beneficiaries yet"
              description="Save the people and businesses you pay every month, like family, your landlord or a school."
              action={
                <Link to="?tab=beneficiaries&create=beneficiary" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover">
                  Add Beneficiary
                </Link>
              }
            />
          )
        }
      >
        {(d) => (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">Beneficiaries</caption>
                <thead className="text-xs text-muted">
                  <tr className="border-b border-line">
                    <th scope="col" className="py-3 font-normal">Recipient</th>
                    <th scope="col" className="py-3 font-normal">Bank Name</th>
                    <th scope="col" className="py-3 font-normal">Account Number</th>
                    <th scope="col" className="py-3 font-normal">Category</th>
                    <th scope="col" className="py-3 font-normal">Next split</th>
                    <th scope="col" className="py-3 text-right font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {d.data.map((b) => (
                    <tr key={b.id} className="border-b border-line last:border-0">
                      <td className="py-3 text-ink">
                        {b.accountName}
                        {b.status === 'paused' && <span className="ml-2 rounded-full bg-chip px-2 py-0.5 text-xs text-muted">Paused</span>}
                      </td>
                      <td className="py-3 text-ink">{b.bankName}</td>
                      <td className="py-3 text-ink">{maskAccountNumber(b)}</td>
                      <td className="py-3">{b.category && <span className="rounded-lg border border-line px-2.5 py-1 text-xs">{b.category.name}</span>}</td>
                      <td className="py-3 text-ink">{b.nextSplitDate ? formatDay(b.nextSplitDate) : '–'}</td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/destinations/beneficiaries/${b.id}`} aria-label={`View ${b.accountName}`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink">
                            <Eye aria-hidden="true" className="size-4" />
                          </Link>
                          <Link to={`/destinations/beneficiaries/${b.id}?edit=1`} aria-label={`Edit ${b.accountName}`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink">
                            <Pencil aria-hidden="true" className="size-4" />
                          </Link>
                          <button type="button" onClick={() => setDeleting(b)} aria-label={`Delete ${b.accountName}`} className="grid size-9 place-items-center rounded-lg text-danger hover:bg-danger-soft">
                            <Trash2 aria-hidden="true" className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={d.pagination.pages} total={d.pagination.total} shown={d.data.length} noun="beneficiaries" onPage={setPage} />
          </>
        )}
      </QueryView>
      <DeleteBeneficiaryDialog beneficiary={deleting} onClose={() => setDeleting(null)} />
    </section>
  )
}

export function DestinationsPage() {
  const currency = useAccountCurrency()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'beneficiaries' ? 'beneficiaries' : 'wallets'
  const create = params.get('create')

  const setTab = (next: Tab) => setParams({ tab: next }, { replace: true })
  const closeCreate = () => setParams({ tab }, { replace: true })
  const afterSave = (type: 'wallet' | 'beneficiary', id: string, intent: SaveIntent) => {
    if (intent === 'rule') navigate(ruleLink(type, id))
    else closeCreate()
  }

  return (
    <>
      <DestinationsHeader />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          hideLabel
          label="Destination type"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'wallets', label: 'Wallets' },
            { value: 'beneficiaries', label: 'Beneficiary' },
          ]}
        />
        <Button onClick={() => setParams({ tab, create: tab === 'wallets' ? 'wallet' : 'beneficiary' })}>
          <Plus aria-hidden="true" className="size-4" />
          {tab === 'wallets' ? 'Create Wallet' : 'Add Beneficiary'}
        </Button>
      </div>

      {tab === 'wallets' && <WalletsTab currency={currency} />}
      {tab === 'beneficiaries' && <BeneficiariesTab />}

      <Modal open={create === 'wallet'} onOpenChange={(open) => !open && closeCreate()} title="Create New Wallet">
        <WalletForm currency={currency} onSaved={(w, intent) => afterSave('wallet', w.id, intent)} />
      </Modal>
      <Modal open={create === 'beneficiary'} onOpenChange={(open) => !open && closeCreate()} title="Add Recipient/Beneficiary">
        <BeneficiaryForm onSaved={(b, intent) => afterSave('beneficiary', b.id, intent)} />
      </Modal>
    </>
  )
}
