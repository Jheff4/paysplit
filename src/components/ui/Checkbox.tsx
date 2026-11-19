import { useId, type ComponentProps, type ReactNode } from 'react'

type CheckboxProps = Omit<ComponentProps<'input'>, 'id' | 'type'> & { label: ReactNode; hint?: string }

export function Checkbox({ label, hint, ...props }: CheckboxProps) {
  const id = useId()
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 size-5 shrink-0 rounded accent-link"
        {...props}
      />
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-label">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </span>
        )}
      </div>
    </div>
  )
}
