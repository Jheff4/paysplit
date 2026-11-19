import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { errorMessage } from '@/api/errors'
import { cn } from '@/lib/cn'
import { Alert } from './Alert'
import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-line/60 motion-reduce:animate-none', className)} />
}

export function LoadingBlock({ label = 'Loading', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
  title = 'We could not load this',
}: {
  error: unknown
  onRetry?: () => void
  title?: string
}) {
  return (
    <Alert
      tone="error"
      live
      title={title}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    >
      {errorMessage(error)}
    </Alert>
  )
}

type QueryViewProps<T> = {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
  loading?: ReactNode
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  errorTitle?: string
}

export function QueryView<T>({ query, children, loading, isEmpty, empty, errorTitle }: QueryViewProps<T>) {
  if (query.isPending) return <>{loading ?? <LoadingBlock />}</>
  if (query.isError && query.data === undefined) {
    return <ErrorState error={query.error} title={errorTitle} onRetry={() => void query.refetch()} />
  }
  const data = query.data as T
  return (
    <>
      {query.isError && (
        <Alert
          tone="warning"
          live
          className="mb-4"
          action={
            <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
              Refresh
            </Button>
          }
        >
          Showing saved data. We could not refresh it: {errorMessage(query.error)}
        </Alert>
      )}
      {isEmpty?.(data) && empty ? empty : children(data)}
    </>
  )
}
