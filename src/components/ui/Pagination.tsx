import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Pagination({
  page,
  pages,
  total,
  shown,
  noun,
  onPage,
}: {
  page: number
  pages: number
  total: number
  shown: number
  noun: string
  onPage: (page: number) => void
}) {
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  )
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted">
        Showing {shown} of {total} {noun}
      </span>
      {pages > 1 && (
        <nav aria-label={`${noun} pages`} className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="grid size-9 place-items-center rounded-lg hover:bg-canvas disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          {numbers.map((n, i) => (
            <span key={n} className="flex items-center">
              {i > 0 && numbers[i - 1]! < n - 1 && <span className="px-1 text-muted">…</span>}
              <button
                type="button"
                onClick={() => onPage(n)}
                aria-current={n === page ? 'page' : undefined}
                aria-label={`Page ${n}`}
                className={cn('grid size-9 place-items-center rounded-full', n === page ? 'bg-ink text-white' : 'hover:bg-canvas')}
              >
                {n}
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            aria-label="Next page"
            className="grid size-9 place-items-center rounded-lg hover:bg-canvas disabled:opacity-40"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </nav>
      )}
    </div>
  )
}
