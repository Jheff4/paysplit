import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { RadioGroup } from 'radix-ui'
import { useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { TextField } from '@/components/ui/TextField'
import { minorToInputString } from '@/lib/money'
import { moneyText, toMinor } from '@/lib/moneyField'
import { accentKeys, walletsApi, type Wallet, type WalletDetail } from './api'
import { CategorySelect } from './CategorySelect'

export type SaveIntent = 'save' | 'rule'

export function WalletForm({
  currency,
  wallet,
  secondary,
  showRuleAction = true,
  onSaved,
}: {
  currency: string
  wallet?: WalletDetail
  secondary?: ReactNode
  showRuleAction?: boolean
  onSaved: (wallet: Wallet, intent: SaveIntent) => void
}) {
  const queryClient = useQueryClient()
  const colors = useQuery({ queryKey: accentKeys.all, queryFn: walletsApi.accentColors, staleTime: Infinity })
  const defaultColor = colors.data?.[0]?.key ?? ''
  const [intent, setIntent] = useState<SaveIntent>('save')
  const schema = z
    .object({
      name: z.string().trim().min(1, 'Enter a wallet name.').max(60, 'Use 60 characters or fewer.'),
      categoryId: z.string().min(1, 'Choose a category.'),
      accentColor: z.string(),
      noTarget: z.boolean(),
      targetAmount: z.string(),
    })
    .superRefine((v, ctx) => {
      if (v.noTarget) return
      const result = moneyText(currency).safeParse(v.targetAmount)
      if (!result.success) ctx.addIssue({ code: 'custom', path: ['targetAmount'], message: result.error.issues[0]!.message })
    })
  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: wallet?.name ?? '',
      categoryId: wallet?.category?.id ?? wallet?.categoryId ?? '',
      accentColor: wallet?.accentColor ?? '',
      noTarget: wallet ? !wallet.targetAmount : false,
      targetAmount: wallet?.targetAmount ? minorToInputString(wallet.targetAmount, currency) : '',
    },
  })
  const noTarget = useWatch({ control, name: 'noTarget' })

  const save = useMutation({
    mutationFn: (values: Values) => {
      const body = {
        name: values.name.trim(),
        categoryId: values.categoryId,
        accentColor: values.accentColor || defaultColor,
        targetAmount: values.noTarget ? null : toMinor(values.targetAmount, currency),
      }
      return wallet ? walletsApi.update(wallet.id, body) : walletsApi.create(body)
    },
    onSuccess: async (saved) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['setup'] }),
      ])
      onSaved(saved, intent)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'WALLET_NAME_TAKEN') {
        setError('name', { message: 'You already have a wallet with this name.' }, { shouldFocus: true })
      }
      if (error instanceof ApiError && error.code === 'INVALID_CATEGORY') {
        setError('categoryId', { message: 'Choose a category from the list.' }, { shouldFocus: true })
      }
    },
  })
  const fieldHandled = save.error instanceof ApiError && ['WALLET_NAME_TAKEN', 'INVALID_CATEGORY'].includes(save.error.code ?? '')

  return (
    <form noValidate onSubmit={handleSubmit((values) => save.mutate(values))} className="flex flex-col gap-4">
      {save.isError && !fieldHandled && (
        <Alert tone="error" live>
          {errorMessage(save.error)}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Wallet Name"
          placeholder="e.g. Children school fees"
          maxLength={60}
          error={errors.name?.message}
          {...register('name')}
        />
        <CategorySelect error={errors.categoryId?.message} {...register('categoryId')} />
      </div>
      <div className="flex flex-col gap-2">
        <TextField
          label="Target Amount"
          inputMode="decimal"
          placeholder="e.g. 1,500,000"
          prefix={currency === 'NGN' ? '₦' : currency}
          disabled={noTarget}
          hint="A target is for tracking only. It never locks your money."
          error={noTarget ? undefined : errors.targetAmount?.message}
          {...register('targetAmount')}
        />
        <Checkbox label="No target amount" {...register('noTarget')} />
      </div>
      <Controller
        control={control}
        name="accentColor"
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <span id="accent-label" className="text-sm font-medium text-label">
              Accent Colour
            </span>
            <RadioGroup.Root
              aria-labelledby="accent-label"
              value={field.value || defaultColor}
              onValueChange={field.onChange}
              orientation="horizontal"
              className="flex flex-wrap gap-2"
            >
              {colors.data?.map((accent) => (
                <RadioGroup.Item
                  key={accent.key}
                  value={accent.key}
                  aria-label={accent.key.charAt(0).toUpperCase() + accent.key.slice(1)}
                  className="grid size-10 place-items-center rounded-full border-2 border-transparent data-[state=checked]:border-ink"
                >
                  <span aria-hidden="true" className="grid size-7 place-items-center rounded-full" style={{ backgroundColor: accent.hex }}>
                    {(field.value || defaultColor) === accent.key && <Check className="size-4 text-white" />}
                  </span>
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
            {colors.isPending && <p className="text-sm text-muted">Loading colours...</p>}
            {colors.isError && <p className="text-sm text-danger">We could not load the colours. Refresh the page to try again.</p>}
          </div>
        )}
      />
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row">
        {secondary}
        <Button
          type="submit"
          variant={showRuleAction && !wallet ? 'secondary' : 'primary'}
          size="lg"
          className="flex-1"
          loading={save.isPending && intent === 'save'}
          disabled={save.isPending}
          onClick={() => setIntent('save')}
        >
          {wallet ? 'Save changes' : 'Save'}
        </Button>
        {showRuleAction && !wallet && (
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            loading={save.isPending && intent === 'rule'}
            disabled={save.isPending}
            onClick={() => setIntent('rule')}
          >
            Save and create rule
          </Button>
        )}
      </div>
    </form>
  )
}
