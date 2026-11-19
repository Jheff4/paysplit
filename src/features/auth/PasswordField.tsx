import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ComponentProps } from 'react'
import { fieldBoxClass } from '@/components/ui/TextField'
import { cn } from '@/lib/cn'
import { PASSWORD_RULES } from './schemas'

type PasswordFieldProps = Omit<ComponentProps<'input'>, 'id' | 'type'> & {
  label: string
  error?: string
  ruleValue?: string
}

export function PasswordField({ label, error, ruleValue, className, ...props }: PasswordFieldProps) {
  const showRules = ruleValue !== undefined
  const id = useId()
  const [visible, setVisible] = useState(false)
  const rulesId = `${id}-rules`
  const errorId = `${id}-error`
  const describedBy = [showRules ? rulesId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-label">
        {label}
      </label>
      <div className={cn(fieldBoxClass, 'pr-1', error ? 'border-danger' : 'border-field')}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-placeholder"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label="Show password"
          aria-pressed={visible}
          aria-controls={id}
          className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:text-ink"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-6" /> : <Eye aria-hidden="true" className="size-6" />}
        </button>
      </div>
      {showRules && (
        <ul id={rulesId} className="mt-1 grid gap-1 text-sm">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(ruleValue ?? '')
            return (
              <li key={rule.id} className={cn('flex items-center gap-2', met ? 'text-success' : 'text-muted')}>
                <span aria-hidden="true">{met ? '✓' : '○'}</span>
                {rule.label}
                <span className="sr-only">{met ? '(done)' : '(not yet)'}</span>
              </li>
            )
          })}
        </ul>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
