import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

const variants = {
  primary: 'bg-brand text-on-brand shadow-xs hover:bg-brand-hover disabled:opacity-60',
  secondary: 'border border-field bg-surface text-label shadow-xs hover:bg-canvas disabled:opacity-60',
  ghost: 'text-ink hover:bg-canvas disabled:text-muted',
  danger: 'bg-danger text-white shadow-xs hover:bg-danger/90 disabled:opacity-60',
} as const

const sizes = {
  lg: 'min-h-15 px-[18px] text-base',
  md: 'min-h-12 px-4 text-sm',
  sm: 'min-h-10 px-3 text-sm',
} as const

type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}
