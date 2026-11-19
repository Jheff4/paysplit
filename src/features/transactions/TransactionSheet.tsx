import { useQuery } from '@tanstack/react-query'
import { Printer, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { Link } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { QueryView } from '@/components/ui/states'
import { formatDateTime } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import { transactionKeys, transactionsApi, type TransactionDetail } from './api'
import { txTitle } from './format'
import { StatusBadge } from './StatusBadge'

function printReceipt() {
  document.body.classList.add('printing-receipt')
  const done = () => {
    document.body.classList.remove('printing-receipt')
    window.removeEventListener('afterprint', done)
  }
  window.addEventListener('afterprint', done)
  window.print()
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium break-all text-ink">{value}</dd>
    </div>
  )
}

function Receipt({ tx, currency }: { tx: TransactionDetail; currency: string }) {
  const cur = tx.currency ?? currency
  const amount = formatMoney(Math.abs(tx.signedAmount ?? tx.amount), cur, undefined, { trimZeroMinor: true })
  const settled = tx.status === 'success'
  return (
    <div data-receipt className="flex flex-col gap-4">
      <div className="rounded-xl bg-canvas p-5 text-center">
        <p className="text-xs text-muted">{tx.direction === 'in' ? 'Amount Received' : 'Total Disbursed Amount'}</p>
        <p className="mt-1 text-3xl font-semibold text-ink">{amount}</p>
        <div className="mt-2">
          <StatusBadge status={tx.status} />
        </div>
      </div>
      {tx.status === 'failed' && (
        <Alert tone="error" title="This transaction failed">
          {tx.failureReason ?? 'The money did not leave. If a balance was reserved, it has been released.'}
        </Alert>
      )}
      {['pending', 'processing', 'retrying'].includes(tx.status) && (
        <Alert tone="warning" title="Not final yet">
          The bank has not confirmed this yet. We update it as soon as it does. Please do not treat it as failed.
        </Alert>
      )}
      <dl className="divide-y divide-line rounded-xl border border-line px-4">
        <Row label="Recipient / Destination" value={txTitle(tx)} />
        <Row label="Destination Type" value={tx.destinationType ?? tx.type} />
        <Row label="From" value={tx.sourceName ?? tx.source} />
        <Row label="Category" value={tx.category} />
        <Row label="Timestamp" value={formatDateTime(tx.createdAt)} />
        <Row label="Reference" value={tx.reference} />
        <Row label="Settlement Reference" value={tx.settlementReference ?? tx.providerReference} />
        <Row label="Split rule" value={tx.ruleName} />
        <Row label="Fee" value={typeof tx.fee === 'number' ? formatMoney(tx.fee, cur) : null} />
        <Row label="Narration" value={tx.narration} />
      </dl>
      {tx.splitRunId && (
        <Link to={`/split-runs/${tx.splitRunId}`} className="text-sm font-medium text-link underline underline-offset-4 print:hidden">
          See the split this came from
        </Link>
      )}
      {!settled && <p className="text-xs text-muted print:hidden">A receipt is final once the transaction succeeds.</p>}
    </div>
  )
}

export function TransactionSheet({ id, currency, onClose }: { id: string; currency: string; onClose: () => void }) {
  const tx = useQuery({ queryKey: transactionKeys.detail(id), queryFn: () => transactionsApi.get(id) })
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 print:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-surface shadow-modal print:static print:max-w-none print:shadow-none"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="text-lg font-medium text-ink">Transaction Details</Dialog.Title>
            <Dialog.Close aria-label="Close" className="grid size-10 place-items-center rounded-lg text-muted hover:bg-canvas print:hidden">
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <QueryView query={tx} errorTitle="We could not load this transaction">
              {(data) => <Receipt tx={data} currency={currency} />}
            </QueryView>
          </div>
          <div className="flex justify-end border-t border-line p-4 print:hidden">
            <Button variant="secondary" disabled={!tx.data} onClick={printReceipt}>
              <Printer aria-hidden="true" className="size-4" />
              Print or save receipt
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
