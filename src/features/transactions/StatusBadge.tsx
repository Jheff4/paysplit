import type { TransactionStatus } from '@/api/types'
import { cn } from '@/lib/cn'

const tones: Record<string, string> = {
  success: 'bg-success-soft text-success',
  pending: 'bg-warning-soft text-warning',
  processing: 'bg-warning-soft text-warning',
  retrying: 'bg-warning-soft text-warning',
  failed: 'bg-danger-soft text-danger',
  reversed: 'bg-chip text-muted',
}

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const text = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', tones[status] ?? 'bg-chip text-muted')}>
      {text}
    </span>
  )
}
