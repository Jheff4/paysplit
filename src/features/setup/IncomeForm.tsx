import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { errorMessage } from '@/api/errors'
import type { Income } from '@/api/types'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import { minorToInputString } from '@/lib/money'
import { moneyText, toMinor } from '@/lib/moneyField'
import { setupApi } from './api'

export function IncomeForm({
  currency,
  income,
  submitLabel = 'Save',
  secondary,
  onSaved,
}: {
  currency: string
  income: Income | null
  submitLabel?: string
  secondary?: ReactNode
  onSaved?: () => void
}) {
  const queryClient = useQueryClient()
  const schema = z.object({
    employerName: z.string().trim().min(1, 'Enter your employer.').max(120, 'Use 120 characters or fewer.'),
    monthlyAmount: moneyText(currency),
    paydayDay: z.string().regex(/^([1-9]|[12]\d|3[01])$/, 'Choose the day your salary usually arrives.'),
  })
  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      employerName: income?.employerName ?? '',
      monthlyAmount: income ? minorToInputString(income.monthlyAmount, currency) : '',
      paydayDay: income ? String(income.paydayDay) : '',
    },
  })

  const save = useMutation({
    mutationFn: (values: Values) =>
      setupApi.saveIncome({
        employerName: values.employerName.trim(),
        monthlyAmount: toMinor(values.monthlyAmount, currency),
        paydayDay: Number(values.paydayDay),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['setup'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['split-rules'] }),
      ])
      onSaved?.()
    },
  })

  return (
    <form noValidate onSubmit={handleSubmit((values) => save.mutate(values))} className="flex flex-col gap-4">
      {save.isError && (
        <Alert tone="error" live>
          {errorMessage(save.error)}
        </Alert>
      )}
      <TextField
        label="Employer"
        autoComplete="organization"
        placeholder="e.g. Talent Nation"
        error={errors.employerName?.message}
        {...register('employerName')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Monthly Salary Amount"
          inputMode="decimal"
          placeholder="850,000"
          prefix={currency === 'NGN' ? '₦' : currency}
          error={errors.monthlyAmount?.message}
          {...register('monthlyAmount')}
        />
        <SelectField
          label="Expected Payday (Day of Month)"
          hint="In shorter months, 29 to 31 means the last day of the month."
          error={errors.paydayDay?.message}
          {...register('paydayDay')}
        >
          <option value="">Choose a day</option>
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              {i + 1}
            </option>
          ))}
        </SelectField>
      </div>
      <p className="text-sm text-muted">
        This is an estimate used to show your next expected split. A split only runs after your salary actually arrives.
      </p>
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row">
        {secondary}
        <Button type="submit" size="lg" loading={save.isPending} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
