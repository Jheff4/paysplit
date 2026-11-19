import { RadioGroup } from 'radix-ui'
import { useId } from 'react'
import { cn } from '@/lib/cn'

type Option<T extends string> = { value: T; label: string }

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-sm font-medium text-label">
        {label}
      </span>
      <RadioGroup.Root
        aria-labelledby={id}
        value={value}
        onValueChange={(next) => onChange(next as T)}
        orientation="horizontal"
        className="flex w-fit max-w-full flex-wrap gap-1 rounded-xl bg-chip p-1"
      >
        {options.map((option) => (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            className={cn(
              'min-h-10 rounded-lg px-3 text-sm',
              option.value === value ? 'bg-surface font-medium text-ink shadow-xs' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  )
}
