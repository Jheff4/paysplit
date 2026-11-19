import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import { toInternationalPhone } from '@/lib/phone'
import { kycApi, type Country, type KycStatus } from './api'
import { StepHeading } from './StepHeading'

const schema = z.object({
  countryCode: z.string().min(1, 'Choose your country.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{6,16}$/, 'Enter a valid mobile number.'),
})
type Values = z.infer<typeof schema>

function localPart(phone: string | null, dialCode: string | undefined): string {
  if (!phone) return ''
  return dialCode && phone.startsWith(dialCode) ? phone.slice(dialCode.length) : phone
}

export function ProfileStep({ status, countries }: { status: KycStatus; countries: Country[] }) {
  const queryClient = useQueryClient()
  const saved = status.steps.profile
  const initialCountry = saved.countryCode ?? 'NG'
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      countryCode: initialCountry,
      phone: localPart(saved.phoneNumber, countries.find((c) => c.code === initialCountry)?.dialCode),
    },
  })
  const countryCode = useWatch({ control, name: 'countryCode' })
  const country = countries.find((c) => c.code === countryCode)

  const save = useMutation({
    mutationFn: (values: Values) =>
      kycApi.saveProfile({
        countryCode: values.countryCode,
        phoneNumber: toInternationalPhone(values.phone, country?.dialCode ?? ''),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kyc'] }),
  })

  const serverError =
    save.error instanceof ApiError && save.error.status === 400
      ? `${errorMessage(save.error)} Check the country and number.`
      : save.error && errorMessage(save.error)

  return (
    <form noValidate onSubmit={handleSubmit((values) => save.mutate(values))} className="flex h-full flex-col gap-10">
      <StepHeading title="Profile Basics" description="Select your operating region and default currency for salary processing." />
      {serverError && (
        <Alert tone="error" live>
          {serverError}
        </Alert>
      )}
      <div className="flex flex-col gap-4">
        <SelectField
          label="Country"
          hint={country ? `Salary is processed in ${country.currency}.` : undefined}
          error={errors.countryCode?.message}
          {...register('countryCode')}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Mobile Phone Number"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="803 456 7890"
          prefix={<span className="border-r border-field pr-3">{country?.dialCode}</span>}
          hint="We'll use this number for verification and messages about your account."
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>
      <Button type="submit" size="lg" loading={save.isPending} className="mt-auto w-full">
        Continue
      </Button>
    </form>
  )
}
