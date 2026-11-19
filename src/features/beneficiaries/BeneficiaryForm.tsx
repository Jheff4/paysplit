import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/SelectField'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { CategorySelect } from '@/features/wallets/CategorySelect'
import type { SaveIntent } from '@/features/wallets/WalletForm'
import { beneficiariesApi, beneficiaryKeys, maskAccountNumber, type Beneficiary, type BeneficiaryDetail } from './api'

const schema = z.object({
  bankCode: z.string().min(1, 'Choose a bank.'),
  accountNumber: z.string().regex(/^\d{10}$/, 'Enter the 10-digit account number.'),
  categoryId: z.string().min(1, 'Choose a category.'),
  narration: z.string().trim().max(100, 'Use 100 characters or fewer.'),
})
type Values = z.infer<typeof schema>

function AccountLookup({ lookup, ready }: { lookup: ReturnType<typeof useResolvedName>; ready: boolean }) {
  if (!ready) return null
  return (
    <p role="status" className="flex min-h-6 items-center gap-2 text-sm">
      {lookup.isPending ? (
        <>
          <Spinner className="size-4 text-muted" /> <span className="text-muted">Checking the account name...</span>
        </>
      ) : lookup.isError ? (
        <span className="text-danger">{errorMessage(lookup.error)}</span>
      ) : (
        <span className="inline-flex items-center gap-1.5 font-medium text-success">
          {lookup.data.accountName}
          <CircleCheck aria-hidden="true" className="size-4" />
          <span className="sr-only">account found</span>
        </span>
      )}
    </p>
  )
}

function useResolvedName(bankCode: string, accountNumber: string) {
  const ready = bankCode !== '' && /^\d{10}$/.test(accountNumber)
  return useQuery({
    queryKey: ['beneficiaries', 'resolve', bankCode, accountNumber],
    queryFn: ({ signal }) => beneficiariesApi.resolve({ bankCode, accountNumber }, signal),
    enabled: ready,
    retry: false,
    staleTime: 30 * 60_000,
  })
}

export function BeneficiaryForm({
  beneficiary,
  secondary,
  showRuleAction = true,
  onSaved,
}: {
  beneficiary?: BeneficiaryDetail
  secondary?: ReactNode
  showRuleAction?: boolean
  onSaved: (beneficiary: Beneficiary, intent: SaveIntent) => void
}) {
  const queryClient = useQueryClient()
  const [intent, setIntent] = useState<SaveIntent>('save')
  const editing = !!beneficiary
  const banks = useQuery({ queryKey: beneficiaryKeys.banks, queryFn: beneficiariesApi.banks, staleTime: 24 * 60 * 60_000, enabled: !editing })

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: (editing ? zodResolver(schema.pick({ categoryId: true, narration: true })) : zodResolver(schema)) as Resolver<Values>,
    defaultValues: {
      bankCode: beneficiary?.bankCode ?? '',
      accountNumber: beneficiary?.accountNumber ?? '',
      categoryId: beneficiary?.category?.id ?? beneficiary?.categoryId ?? '',
      narration: beneficiary?.narration ?? '',
    },
  })
  const bankCode = useWatch({ control, name: 'bankCode' })
  const accountNumber = useWatch({ control, name: 'accountNumber' })
  const lookupReady = !editing && bankCode !== '' && /^\d{10}$/.test(accountNumber)
  const resolved = useResolvedName(editing ? '' : bankCode, editing ? '' : accountNumber)

  const save = useMutation({
    mutationFn: (values: Values) =>
      editing
        ? beneficiariesApi.update(beneficiary.id, { categoryId: values.categoryId, narration: values.narration || null })
        : beneficiariesApi.create({
            bankCode: values.bankCode,
            accountNumber: values.accountNumber,
            categoryId: values.categoryId,
            ...(values.narration ? { narration: values.narration } : {}),
          }),
    onSuccess: async (saved) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['beneficiaries'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['setup'] }),
      ])
      onSaved(saved, intent)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'BENEFICIARY_EXISTS') {
        setError('accountNumber', { message: 'You have already saved this account.' }, { shouldFocus: true })
      }
    },
  })

  const blockedByLookup = !editing && !resolved.isSuccess
  const fieldHandled = save.error instanceof ApiError && save.error.code === 'BENEFICIARY_EXISTS'

  return (
    <form noValidate onSubmit={handleSubmit((values) => save.mutate(values))} className="flex flex-col gap-4">
      {save.isError && !fieldHandled && (
        <Alert tone="error" live>
          {errorMessage(save.error)}
        </Alert>
      )}
      {editing ? (
        <dl className="grid gap-3 rounded-xl border border-line p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Account name</dt>
            <dd className="font-medium text-ink">{beneficiary.accountName}</dd>
          </div>
          <div>
            <dt className="text-muted">Bank</dt>
            <dd className="text-ink">{beneficiary.bankName}</dd>
          </div>
          <div>
            <dt className="text-muted">Account number</dt>
            <dd className="text-ink">{maskAccountNumber(beneficiary)}</dd>
          </div>
        </dl>
      ) : (
        <>
          <SelectField
            label="Bank Name"
            error={errors.bankCode?.message ?? (banks.isError ? errorMessage(banks.error) : undefined)}
            disabled={banks.isPending}
            {...register('bankCode')}
          >
            <option value="">{banks.isPending ? 'Loading banks...' : 'Choose a bank'}</option>
            {banks.data?.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </SelectField>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <TextField
                label="Account Number (10 digits)"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder="e.g. 0123456789"
                error={errors.accountNumber?.message}
                {...register('accountNumber', {
                  onChange: (e) =>
                    setValue('accountNumber', String(e.target.value).replace(/\D/g, '').slice(0, 10), { shouldValidate: false }),
                })}
              />
              <AccountLookup lookup={resolved} ready={lookupReady} />
            </div>
            <CategorySelect error={errors.categoryId?.message} {...register('categoryId')} />
          </div>
        </>
      )}
      {editing && <CategorySelect error={errors.categoryId?.message} {...register('categoryId')} />}
      <TextField
        label="Payment Narration / Reference Note (optional)"
        placeholder="e.g. payment for rent"
        maxLength={100}
        error={errors.narration?.message}
        {...register('narration')}
      />
      {lookupReady && resolved.isError && (
        <p className="text-sm text-muted">We can only save an account after its name is confirmed.</p>
      )}
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row">
        {secondary}
        <Button
          type="submit"
          variant={showRuleAction && !editing ? 'secondary' : 'primary'}
          size="lg"
          className="flex-1"
          disabled={save.isPending || blockedByLookup}
          loading={save.isPending && intent === 'save'}
          onClick={() => setIntent('save')}
        >
          {editing ? 'Save changes' : 'Save'}
        </Button>
        {showRuleAction && !editing && (
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={save.isPending || blockedByLookup}
            loading={save.isPending && intent === 'rule'}
            onClick={() => setIntent('rule')}
          >
            Save and create rule
          </Button>
        )}
      </div>
    </form>
  )
}
