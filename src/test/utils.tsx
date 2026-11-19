import { render } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers'
import { routes } from '@/app/routes'
import { API_BASE_URL } from '@/config'

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`

export const server = setupServer()

export function setupMockApi() {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}

export function renderRoute(path: string, state?: unknown) {
  const url = new URL(path, 'http://localhost')
  const router = createMemoryRouter(routes, { initialEntries: [{ pathname: url.pathname, search: url.search, state }] })
  const view = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { router, ...view }
}
