import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const fieldBoxClass =
  'flex min-h-15 items-center gap-2 rounded-xl border bg-surface px-3.5 shadow-xs focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-link'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id' | 'prefix'> & {
  label: string
  hint?: ReactNode
  error?: string
  prefix?: ReactNode
}

export function TextField({ label, hint, error, prefix, className, required, ...props }: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-label">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
        )}
      </label>
      <div className={cn(fieldBoxClass, error ? 'border-danger' : 'border-field')}>
        {prefix && <span className="text-base text-muted">{prefix}</span>}
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-placeholder"
          {...props}
        />
      </div>
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
