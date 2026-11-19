import { Link } from 'react-router'
import { usePageTitle } from '@/lib/usePageTitle'

export function DestinationsHeader({ current }: { current?: string }) {
  usePageTitle(current ?? 'Destinations')
  return (
    <header className="mb-5 flex flex-col gap-2">
      <h1 tabIndex={-1} className="text-2xl leading-8 text-black outline-none">
        Destinations
      </h1>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link to="/" className="font-medium text-link hover:underline">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted">/</li>
          {current ? (
            <>
              <li>
                <Link to="/destinations" className="font-medium text-link hover:underline">
                  Destinations
                </Link>
              </li>
              <li aria-hidden="true" className="text-muted">/</li>
              <li aria-current="page" className="text-muted">
                {current}
              </li>
            </>
          ) : (
            <li aria-current="page" className="text-muted">
              Destinations
            </li>
          )}
        </ol>
      </nav>
    </header>
  )
}
