import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Wallet } from 'lucide-react'
import { RadioGroup } from 'radix-ui'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import { beneficiariesApi } from '@/features/beneficiaries/api'
import { dashboardApi, dashboardKeys } from '@/features/dashboard/api'
import { walletKeys, walletsApi } from '@/features/wallets/api'
import { cn } from '@/lib/cn'
import { formatMoney, minorToInputString, parseMoneyInput } from '@/lib/money'
import { moneyText, toMinor } from '@/lib/moneyField'
import { allocationCheck, basisPointsToPercent, parsePercent, ruleMonthlyAmount } from './allocation'
import { ruleKeys, rulesApi, type DestinationType, type RuleMethod, type SplitRule } from './api'

type Values = {
  name: string
  priority: string
  destinationType: DestinationType
  destinationId: string
  method: RuleMethod
  amount: string
}

function makeSchema(currency: string) {
  return z
    .object({
      name: z.string().trim().min(1, 'Give this rule a name.').max(80, 'Use 80 characters or fewer.'),
      priority: z.string().regex(/^(100|[1-9]\d?)$/, 'Priority is a whole number from 1 to 100.'),
      destinationType: z.enum(['wallet', 'beneficiary']),
      destinationId: z.string(),
      method: z.enum(['fixed', 'percentage']),
      amount: z.string(),
    })
    .superRefine((v, ctx) => {
      if (!v.destinationId) {
        ctx.addIssue({ code: 'custom', path: ['destinationId'], message: v.destinationType === 'wallet' ? 'Choose a wallet.' : 'Choose a beneficiary.' })
      }
      if (v.method === 'percentage') {
        const p = parsePercent(v.amount)
        if (!p.ok) ctx.addIssue({ code: 'custom', path: ['amount'], message: p.message })
      } else {
        const m = moneyText(currency).safeParse(v.amount)
        if (!m.success) ctx.addIssue({ code: 'custom', path: ['amount'], message: m.error.issues[0]!.message })
      }
    })
}

function amountFromInput(method: RuleMethod, text: string, currency: string, baseline: number | null): number | null {
  if (method === 'fixed') {
    const parsed = parseMoneyInput(text, currency)
    return parsed.ok ? parsed.minor : null
  }
  const p = parsePercent(text)
  return p.ok ? ruleMonthlyAmount({ method, value: basisPointsToPercent(p.basisPoints) }, baseline) : null
}

export function RuleForm({
  currency,
  rule,
  preset,
  submitLabel,
  onSaved,
}: {
  currency: string
  rule?: SplitRule
  preset?: { destinationType: DestinationType; destinationId: string }
  submitLabel?: string
  onSaved: (rule: SplitRule) => void
}) {
  const queryClient = useQueryClient()
  const summary = useQuery({ queryKey: ruleKeys.summary, queryFn: rulesApi.summary })
  const dashboard = useQuery({ queryKey: dashboardKeys.summary, queryFn: dashboardApi.summary })
  const kycApproved = dashboard.data ? dashboard.data.onboarding.progress.kycCompleted : true
  const lockedByKyc = !rule && !kycApproved
  const wallets = useQuery({ queryKey: walletKeys.all, queryFn: walletsApi.list })
  const beneficiaries = useQuery({
    queryKey: ['beneficiaries', 'all-active'],
    queryFn: () => beneficiariesApi.list(1, 'all', ''),
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(makeSchema(currency)),
    defaultValues: {
      name: rule?.name ?? '',
      priority: String(rule?.priority ?? 10),
      destinationType: rule?.destinationType ?? preset?.destinationType ?? 'wallet',
      destinationId: rule ? (rule.walletId ?? rule.beneficiaryId ?? rule.destination?.id ?? '') : (preset?.destinationId ?? ''),
      method: rule?.method ?? 'fixed',
      amount: rule ? (rule.method === 'fixed' ? minorToInputString(rule.value, currency) : String(rule.value)) : '',
    },
  })
  const [destinationType, method, amount] = useWatch({ control, name: ['destinationType', 'method', 'amount'] })

  const baseline = summary.data?.baselineSalary ?? null
  const ownCurrent = rule && rule.status === 'active' ? (ruleMonthlyAmount(rule, baseline) ?? 0) : 0
  const allocatedByOthers = Math.max(0, (summary.data?.totalAllocated ?? 0) - ownCurrent)
  const newAmount = amountFromInput(method, amount, currency, baseline)
  const check = newAmount === null ? null : allocationCheck({ baseline, allocatedByOthers, newAmount })

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const value =
        values.method === 'fixed'
          ? toMinor(values.amount, currency)
          : basisPointsToPercent((parsePercent(values.amount) as { basisPoints: number }).basisPoints)
      const body = {
        name: values.name.trim(),
        priority: Number(values.priority),
        destinationType: values.destinationType,
        ...(values.destinationType === 'wallet' ? { walletId: values.destinationId } : { beneficiaryId: values.destinationId }),
        method: values.method,
        value,
      }
      if (rule) return rulesApi.update(rule.id, body)
      return (await rulesApi.create({ ...body, status: 'active' })).rule
    },
    onSuccess: async (saved) => {
      await Promise.all(
        [['split-rules'], ['dashboard'], ['wallets'], ['beneficiaries'], ['setup']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      )
      onSaved(saved)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'DESTINATION_HAS_RULE') {
        setError('destinationId', { message: 'This destination already has a rule. Edit that rule instead.' }, { shouldFocus: true })
      }
      if (error instanceof ApiError && error.code === 'ALLOCATION_EXCEEDS_SALARY') {
        setError('amount', { message: 'This would allocate more than your monthly salary.' }, { shouldFocus: true })
      }
    },
  })
  const fieldHandled = save.error instanceof ApiError && ['DESTINATION_HAS_RULE', 'ALLOCATION_EXCEEDS_SALARY'].includes(save.error.code ?? '')

  const destinationOptions =
    destinationType === 'wallet'
      ? (wallets.data ?? []).map((w) => ({
          id: w.id,
          label: `${w.name} (balance ${formatMoney(w.balance, w.currency ?? currency)})`,
        }))
      : (beneficiaries.data?.data ?? []).map((b) => ({
          id: b.id,
          label: `${b.accountName} (${b.bankName})${b.status === 'paused' ? ', paused' : ''}`,
        }))
  const destinationsLoading = destinationType === 'wallet' ? wallets.isPending : beneficiaries.isPending

  if (lockedByKyc) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <p className="text-base font-semibold text-ink">Split rules unlock after identity verification</p>
        <p className="max-w-md text-sm text-muted">
          A rule moves real money, so PaySplit needs to verify who you are first. It takes about 3 minutes. Your wallets and
          beneficiaries are already saved.
        </p>
        <Link
          to="/verify-identity"
          className="inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-medium text-on-brand hover:bg-brand-hover"
        >
          Verify your identity
        </Link>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => {
        if (check?.status === 'over') return
        save.mutate(values)
      })}
      className="flex flex-col gap-4"
    >
      {save.isError && !fieldHandled && (
        <Alert tone="error" live>
          {errorMessage(save.error)}
          {save.error instanceof ApiError && save.error.code === 'KYC_REQUIRED' && (
            <>
              {' '}
              <Link to="/verify-identity" className="font-semibold underline">
                Verify your identity
              </Link>
            </>
          )}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <TextField label="Rule Name" placeholder="e.g. Payment for rent" maxLength={80} error={errors.name?.message} {...register('name')} />
        <TextField
          label="Priority"
          inputMode="numeric"
          hint="1 runs first"
          error={errors.priority?.message}
          {...register('priority')}
        />
      </div>

      <Controller
        control={control}
        name="destinationType"
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <span id="destination-type" className="text-sm font-medium text-label">
              Destination Type
            </span>
            <RadioGroup.Root
              aria-labelledby="destination-type"
              value={field.value}
              disabled={!!rule}
              onValueChange={(next) => {
                field.onChange(next)
                setValue('destinationId', '')
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {(
                [
                  { value: 'wallet', title: 'Move to Wallet', detail: 'Internal budget or savings', Icon: Wallet },
                  { value: 'beneficiary', title: 'Send to Beneficiary', detail: 'External bank payout', Icon: Users },
                ] as const
              ).map(({ value, title, detail, Icon }) => (
                <RadioGroup.Item
                  key={value}
                  value={value}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-60',
                    field.value === value ? 'border-link bg-brand-soft' : 'border-line',
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-ink shadow-xs">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink">{title}</span>
                    <span className="block text-xs text-muted">{detail}</span>
                  </span>
                  <span aria-hidden="true" className={cn('grid size-5 place-items-center rounded-full border-2', field.value === value ? 'border-link' : 'border-field')}>
                    {field.value === value && <span className="size-2.5 rounded-full bg-link" />}
                  </span>
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
          </div>
        )}
      />

      <Controller
        control={control}
        name="destinationId"
        render={({ field }) => (
          <SelectField
            label={destinationType === 'wallet' ? 'Select Wallet' : 'Select Beneficiary'}
            disabled={!!rule || destinationsLoading}
            error={errors.destinationId?.message}
            hint={
              !destinationsLoading && destinationOptions.length === 0 ? (
                <>
                  You have no {destinationType === 'wallet' ? 'wallets' : 'beneficiaries'} yet.{' '}
                  <Link
                    to={`/destinations?tab=${destinationType === 'wallet' ? 'wallets' : 'beneficiaries'}&create=${destinationType}`}
                    className="font-medium text-link underline underline-offset-4"
                  >
                    Create one first
                  </Link>
                  .
                </>
              ) : undefined
            }
            name={field.name}
            ref={field.ref}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(e) => field.onChange(e.target.value)}
          >
            <option value="">{destinationsLoading ? 'Loading...' : 'Choose one'}</option>
            {destinationOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </SelectField>
        )}
      />

      <div className="flex flex-col gap-2">
        <Controller
          control={control}
          name="method"
          render={({ field }) => (
            <SegmentedControl
              label="Allocation Method & Value"
              value={field.value}
              onChange={(next) => {
                field.onChange(next)
                setValue('amount', '')
              }}
              options={[
                { value: 'fixed', label: `Fix Amount (${currency === 'NGN' ? '₦' : currency})` },
                { value: 'percentage', label: 'Percentage (%)' },
              ]}
            />
          )}
        />
        <TextField
          label={method === 'fixed' ? 'Amount' : 'Percentage of salary'}
          inputMode="decimal"
          placeholder={method === 'fixed' ? 'e.g. 30,000' : 'e.g. 12.5'}
          prefix={method === 'fixed' ? (currency === 'NGN' ? '₦' : currency) : undefined}
          error={errors.amount?.message}
          {...register('amount')}
        />
      </div>

      <div aria-live="polite">
        {check?.status === 'over' && (
          <Alert tone="error" title="This rule would over-allocate your salary">
            You have {formatMoney(check.available, currency)} unallocated. This rule needs{' '}
            {formatMoney(newAmount ?? 0, currency)}, which is {formatMoney(check.overBy, currency)} too much. Lower the amount or
            reduce another rule.
          </Alert>
        )}
        {check?.status === 'fits' && newAmount !== null && (
          <p className="rounded-xl bg-brand-soft p-3 text-sm text-ink">
            About <strong>{formatMoney(newAmount, currency)}</strong> a month
            {method === 'percentage' && baseline !== null ? `, based on your ${formatMoney(baseline, currency)} salary` : ''}.{' '}
            {formatMoney(check.remainingAfter, currency)} stays unallocated.
          </p>
        )}
        {(check?.status === 'unknown' || (method === 'percentage' && baseline === null && amount)) && (
          <Alert tone="warning">
            Add your monthly salary in{' '}
            <Link to="/setup" className="font-semibold underline">
              Setup
            </Link>{' '}
            so we can check this rule fits within it.
          </Alert>
        )}
      </div>

      <Button type="submit" size="lg" loading={save.isPending} disabled={check?.status === 'over'} className="mt-2 w-full">
        {submitLabel ?? (rule ? 'Save changes' : 'Activate Split Rule')}
      </Button>
    </form>
  )
}
