import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { errorMessage } from '@/api/errors'
import type { Income } from '@/api/types'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { RunResult } from '@/features/runs/RunResult'
import { formatMoney, minorToInputString } from '@/lib/money'
import { moneyText, toMinor } from '@/lib/moneyField'
import { salaryApi } from './api'

const AFFECTED = [['dashboard'], ['transactions'], ['wallets'], ['split-runs'], ['split-rules'], ['notifications']]

export function SimulateSalaryDialog({
  currency,
  income,
  open,
  onOpenChange,
}: {
  currency: string
  income: Income | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const schema = z.object({
    amount: moneyText(currency),
    senderName: z.string().trim().max(80, 'Use 80 characters or fewer.'),
    narration: z.string().trim().max(120, 'Use 120 characters or fewer.'),
  })
  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: income ? minorToInputString(income.monthlyAmount, currency) : '',
      senderName: income?.employerName ?? '',
      narration: '',
    },
  })

  const send = useMutation({
    mutationFn: (values: Values) =>
      salaryApi.simulateCredit({
        amount: toMinor(values.amount, currency),
        ...(values.senderName.trim() ? { senderName: values.senderName.trim() } : {}),
        ...(values.narration.trim() ? { narration: values.narration.trim() } : {}),
      }),
    onSettled: () => Promise.all(AFFECTED.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  })

  const close = (next: boolean) => {
    if (send.isPending) return
    if (!next) {
      send.reset()
      reset()
    }
    onOpenChange(next)
  }
  const result = send.data
  const sentAmount = send.variables ? toMinor(send.variables.amount, currency) : 0

  return (
    <Modal
      open={open}
      onOpenChange={close}
      size="md"
      title="Simulate salary payment"
      description="This sandbox has no real employer, so you can send a test salary into your salary account. No real money moves."
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <Alert tone="success" live>
            {formatMoney(sentAmount, currency)} arrived in your salary account.
          </Alert>
          {result.autoSplit && result.splitRun ? (
            <RunResult run={result.splitRun} currency={currency} showLink compact />
          ) : (
            <p className="text-sm text-muted">
              It was not split automatically. Automatic splits run when a payment is at least half your expected monthly salary and you
              have active rules.{' '}
              <Link to="/split-rules" className="font-medium text-link underline underline-offset-4">
                Split it now with Run Now
              </Link>
              .
            </p>
          )}
          <Button size="lg" onClick={() => close(false)}>
            Done
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit((values) => send.mutate(values))} className="flex flex-col gap-4">
          {send.isError && (
            <Alert tone="error" live>
              {errorMessage(send.error)}
            </Alert>
          )}
          <TextField
            label="Amount"
            inputMode="decimal"
            placeholder="850,000"
            prefix={currency === 'NGN' ? '₦' : currency}
            hint={income ? 'Pre-filled with your expected monthly salary.' : undefined}
            error={errors.amount?.message}
            {...register('amount')}
          />
          <TextField label="Sent by (optional)" placeholder="e.g. Acme Ltd" error={errors.senderName?.message} {...register('senderName')} />
          <TextField
            label="Description (optional)"
            placeholder="e.g. November salary"
            error={errors.narration?.message}
            {...register('narration')}
          />
          <Button type="submit" size="lg" loading={send.isPending}>
            Send test salary
          </Button>
        </form>
      )}
    </Modal>
  )
}
