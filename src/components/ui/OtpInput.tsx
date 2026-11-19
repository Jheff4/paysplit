import { useId, useState, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type OtpInputProps = Omit<ComponentProps<'input'>, 'id' | 'value' | 'maxLength'> & {
  label: string
  value: string
  length?: number
  error?: string
}

export function OtpInput({ label, value, length = 6, error, className, onFocus, onBlur, ...props }: OtpInputProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const errorId = `${id}-error`
  const active = Math.min(value.length, length - 1)

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative w-full max-w-[408px]">
        <div aria-hidden="true" className="grid grid-cols-6 gap-2.5">
          {Array.from({ length }, (_, i) => (
            <div
              key={i}
              className={cn(
                'grid h-15 place-items-center rounded-[10px] border bg-surface text-2xl font-medium text-navy',
                error
                  ? 'border-danger'
                  : focused && i === active
                    ? 'border-link outline-2 outline-offset-2 outline-link'
                    : 'border-field',
              )}
            >
              {value[i] ?? ''}
            </div>
          ))}
        </div>
        <input
          id={id}
          value={value}
          maxLength={length}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
