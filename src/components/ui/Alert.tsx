import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const tones = {
  info: { box: 'bg-info-soft text-info', Icon: Info },
  success: { box: 'bg-success-soft text-success', Icon: CheckCircle2 },
  warning: { box: 'bg-warning-soft text-warning', Icon: AlertTriangle },
  error: { box: 'bg-danger-soft text-danger', Icon: XCircle },
} as const

type AlertProps = {
  tone?: keyof typeof tones
  title?: string
  children?: ReactNode
  action?: ReactNode
  live?: boolean
  className?: string
}

export function Alert({ tone = 'info', title, children, action, live = false, className }: AlertProps) {
  const { box, Icon } = tones[tone]
  return (
    <div
      role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}
      className={cn('flex gap-3 rounded-lg p-4 text-sm', box, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-1 flex-col gap-1 text-ink">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}
