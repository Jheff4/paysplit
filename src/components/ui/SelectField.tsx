import { ChevronDown } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { fieldBoxClass } from './TextField'

type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> & {
  label: string
  hint?: ReactNode
  error?: string
  children: ReactNode
}

export function SelectField({ label, hint, error, className, children, ...props }: SelectFieldProps) {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-label">
        {label}
      </label>
      <div className={cn(fieldBoxClass, 'relative px-0', error ? 'border-danger' : 'border-field')}>
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-full min-h-15 w-full appearance-none bg-transparent pr-11 pl-3.5 text-base text-ink outline-none"
          {...props}
        >
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 size-6 text-muted" />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
