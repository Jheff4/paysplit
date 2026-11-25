import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { TextField } from '@/components/ui/TextField'
import { salaryApi } from './api'

export function SalaryAccountIdForm() {
  const queryClient = useQueryClient()
  const [method, setMethod] = useState<'bvn' | 'nin'>('bvn')
  const [idNumber, setIdNumber] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const label = method === 'bvn' ? 'Bank Verification Number (BVN)' : 'National Identification Number (NIN)'

  const add = useMutation({
    mutationFn: () => salaryApi.addIdentity({ method, idNumber }),
    onSuccess: () =>
      Promise.all([queryClient.invalidateQueries({ queryKey: ['profile'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] })]),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^\d{11}$/.test(idNumber)) {
      setFieldError(`Your ${method.toUpperCase()} is 11 digits.`)
      return
    }
    setFieldError(undefined)
    add.mutate()
  }

  if (add.isSuccess) {
    return (
      <Alert tone="success" live>
        {add.data.status === 'active'
          ? 'Your salary account is open.'
          : 'Your salary account is being opened. This can take a few minutes.'}
      </Alert>
    )
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Your identity is verified, but the bank needs a BVN or NIN to open your salary account. We check that the name on it matches your
        verified name.
      </p>
      <SegmentedControl
        label="ID type"
        value={method}
        onChange={(next) => {
          setMethod(next)
          setFieldError(undefined)
        }}
        options={[
          { value: 'bvn', label: 'BVN' },
          { value: 'nin', label: 'National ID (NIN)' },
        ]}
      />
      {add.isError && (
        <Alert tone="error" live>
          {errorMessage(add.error)}
        </Alert>
      )}
      <TextField
        label={label}
        inputMode="numeric"
        autoComplete="off"
        maxLength={11}
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
        error={fieldError}
      />
      <Button type="submit" loading={add.isPending}>
        Add and open my account
      </Button>
    </form>
  )
}
