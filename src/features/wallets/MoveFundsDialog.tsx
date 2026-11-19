import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { formatMoney } from '@/lib/money'
import { moneyText, toMinor } from '@/lib/moneyField'
import { walletsApi, type WalletDetail } from './api'

export function MoveFundsDialog({
  wallet,
  currency,
  open,
  onOpenChange,
}: {
  wallet: WalletDetail
  currency: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const available = wallet.stats.availableBalance
  const [confirming, setConfirming] = useState<number | null>(null)
  const schema = z.object({ amount: moneyText(currency, { max: available }) })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { amount: '' } })

  const move = useMutation({
    mutationFn: (amount: number) => walletsApi.move(wallet.id, amount),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ])
    },
  })

  const close = (next: boolean) => {
    if (!next) {
      reset()
      setConfirming(null)
      move.reset()
    }
    onOpenChange(next)
  }

  return (
    <Modal open={open} onOpenChange={close} size="md" title="Move to Salary Account" description="Move money from this wallet back to your salary account.">
      {move.isSuccess ? (
        <div className="flex flex-col gap-4">
          <Alert tone="success" live title="Money moved">
            {formatMoney(confirming ?? 0, currency)} is on its way to your salary account. Its status shows in the wallet history.
          </Alert>
          <Button size="lg" onClick={() => close(false)}>
            Done
          </Button>
        </div>
      ) : confirming === null ? (
        <form noValidate onSubmit={handleSubmit(({ amount }) => setConfirming(toMinor(amount, currency)))} className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Available to move: <strong className="text-ink">{formatMoney(available, currency)}</strong>
          </p>
          <TextField
            label="Amount"
            inputMode="decimal"
            prefix={currency === 'NGN' ? '₦' : currency}
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Button type="submit" size="lg" disabled={available <= 0}>
            Review
          </Button>
          {available <= 0 && <p className="text-sm text-muted">This wallet is empty, so there is nothing to move.</p>}
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          {move.isError && (
            <Alert tone="error" live>
              {move.error instanceof ApiError && move.error.code === 'INSUFFICIENT_BALANCE'
                ? 'This wallet no longer has enough money for that. Refresh to see the latest balance.'
                : errorMessage(move.error)}
            </Alert>
          )}
          <dl className="flex flex-col gap-2 rounded-xl border border-line p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">From</dt>
              <dd className="text-right font-medium text-ink">{wallet.name} wallet</dd>
            </div>
            <ArrowDown aria-hidden="true" className="mx-auto size-4 text-muted" />
            <div className="flex justify-between gap-3">
              <dt className="text-muted">To</dt>
              <dd className="text-right font-medium text-ink">Your salary account</dd>
            </div>
            <div className="mt-2 flex justify-between gap-3 border-t border-line pt-3">
              <dt className="text-muted">Amount</dt>
              <dd className="text-right text-lg font-semibold text-ink">{formatMoney(confirming, currency)}</dd>
            </div>
          </dl>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="secondary" size="lg" className="flex-1" disabled={move.isPending} onClick={() => setConfirming(null)}>
              Change amount
            </Button>
            <Button size="lg" className="flex-1" loading={move.isPending} onClick={() => move.mutate(confirming)}>
              Confirm move
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
