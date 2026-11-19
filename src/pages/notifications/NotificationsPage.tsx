import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellOff, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState, QueryView } from '@/components/ui/states'
import { isUnread, notificationKeys, notificationsApi } from '@/features/notifications/api'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/dates'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const feed = useQuery({
    queryKey: notificationKeys.feed(page, filter === 'unread'),
    queryFn: () => notificationsApi.feed(page, filter === 'unread'),
    placeholderData: (previous) => previous,
  })

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ])
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh })
  const markAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh })
  const mutationError = markRead.error ?? markAll.error

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Salary, split, transfer and account updates."
        actions={
          <Button
            variant="secondary"
            loading={markAll.isPending}
            disabled={!feed.data?.unreadCount}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck aria-hidden="true" className="size-4" />
            Mark all as read
          </Button>
        }
      />
      <div className="mb-4">
        <SegmentedControl
          label="Show"
          value={filter}
          onChange={(next) => {
            setFilter(next)
            setPage(1)
          }}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: `Unread${feed.data ? ` (${feed.data.unreadCount})` : ''}` },
          ]}
        />
      </div>
      {mutationError && (
        <Alert tone="error" live className="mb-4">
          {errorMessage(mutationError)}
        </Alert>
      )}
      <QueryView
        query={feed}
        errorTitle="We could not load your notifications"
        isEmpty={(data) => data.data.length === 0}
        empty={
          <EmptyState
            icon={<BellOff aria-hidden="true" className="size-8" />}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description="We will let you know when your salary arrives, when a split runs and when a transfer needs attention."
          />
        }
      >
        {(data) => (
          <>
            <ul className="flex flex-col gap-2">
              {data.data.map((item) => {
                const unread = isUnread(item)
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between',
                      unread ? 'border-link/40 bg-brand-soft' : 'border-line bg-surface',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium text-ink">
                        {unread && (
                          <>
                            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-link" />
                            <span className="sr-only">Unread:</span>
                          </>
                        )}
                        {item.title}
                      </p>
                      {(item.body ?? item.message) && <p className="mt-1 text-sm text-muted">{item.body ?? item.message}</p>}
                      <p className="mt-1 text-xs text-muted">
                        <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                      </p>
                    </div>
                    {unread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-link"
                        loading={markRead.isPending && markRead.variables === item.id}
                        onClick={() => markRead.mutate(item.id)}
                      >
                        Mark as read <span className="sr-only">: {item.title}</span>
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
            {data.pagination.pages > 1 && (
              <nav aria-label="Notification pages" className="mt-4 flex items-center justify-between">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted">
                  Page {data.pagination.page} of {data.pagination.pages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </QueryView>
    </>
  )
}
