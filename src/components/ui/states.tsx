import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { errorMessage } from '@/api/errors'
import { cn } from '@/lib/cn'
import { Alert } from './Alert'
import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  const radius = className?.includes('rounded') ? undefined : 'rounded-md'
  return <div aria-hidden="true" className={cn('animate-pulse bg-line/60 motion-reduce:animate-none', radius, className)} />
}

export function LoadingStatus({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div role="status" className={cn('animate-[appear_150ms_ease-out_200ms_both]', className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <LoadingStatus label={label} className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </LoadingStatus>
  )
}

function RowCardSkeleton({ icon = false }: { icon?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-3">
      {icon && <Skeleton className="size-10 shrink-0 rounded-lg" />}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3 max-w-48" />
        <Skeleton className="h-3 w-1/3 max-w-28" />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export function TableSkeleton({
  label,
  columns,
  rows = 5,
}: {
  label: string
  columns: number
  rows?: number
}) {
  const cells = Array.from({ length: columns }, (_, i) => i)
  return (
    <LoadingStatus label={label}>
      <div className="hidden md:block">
        <div className="flex h-10 items-center gap-6 border-b border-line">
          {cells.map((i) => (
            <Skeleton key={i} className={cn('h-3 flex-1', i === columns - 1 ? 'max-w-12' : 'max-w-24')} />
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex h-[61px] items-center gap-6 border-b border-line last:border-0">
            {cells.map((i) => (
              <Skeleton
                key={i}
                className={cn('h-4 flex-1', i === columns - 1 && 'max-w-16', i === 0 && 'max-w-40')}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {Array.from({ length: rows }, (_, r) => (
          <RowCardSkeleton key={r} />
        ))}
      </div>
    </LoadingStatus>
  )
}

export function ListSkeleton({
  label,
  rows = 3,
  icon = false,
}: {
  label: string
  rows?: number
  icon?: boolean
}) {
  return (
    <LoadingStatus label={label} className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, r) => (
        <RowCardSkeleton key={r} icon={icon} />
      ))}
    </LoadingStatus>
  )
}

export function CardGridSkeleton({ label }: { label: string }) {
  return (
    <LoadingStatus label={label} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn('min-h-[192px] flex-col gap-5 rounded-[20px] bg-chip/60 p-5', i < 2 ? 'flex' : 'hidden xl:flex')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </LoadingStatus>
  )
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[140px] flex-col justify-between rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-surface p-5 shadow-xs',
        className,
      )}
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-3 w-40" />
    </div>
  )
}

export function FormSkeleton({ label, fields = 3 }: { label: string; fields?: number }) {
  return (
    <LoadingStatus label={label} className="flex flex-col gap-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="mt-2 h-12 w-full rounded-xl" />
    </LoadingStatus>
  )
}

export function DetailSkeleton({ label, fields = 6 }: { label: string; fields?: number }) {
  return (
    <LoadingStatus label={label} className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>
    </LoadingStatus>
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
