import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'

export function StubPage({ title }: { title: string }) {
  return <PageHeader title={title} description="This screen is being built." />
}

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <PageHeader title="Page not found" description="The page you are looking for does not exist or has moved." />
      <Link to="/" className="font-semibold text-brand underline">
        Go to your dashboard
      </Link>
    </div>
  )
}

export function RouteErrorPage() {
  const error = useRouteError()
  const chunkFailed = error instanceof TypeError && /dynamically imported module|Importing a module/i.test(error.message)
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : chunkFailed
      ? 'A new version of PaySplit is available.'
      : 'Something went wrong while showing this page.'

  return (
    <div className="mx-auto max-w-md p-6">
      <PageHeader title="Something went wrong" />
      <Alert tone="error" live action={<Button onClick={() => window.location.reload()}>Reload page</Button>}>
        {message}
      </Alert>
    </div>
  )
}
