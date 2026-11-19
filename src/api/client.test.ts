import { ApiError, NetworkError, api, configureApi } from './client'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const fetchMock = vi.fn<typeof fetch>()
const onUnauthorized = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  onUnauthorized.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  configureApi({ baseUrl: 'https://api.test/v1', getToken: () => 'session-token', onUnauthorized })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('sends the session token and JSON body, returns parsed JSON', async () => {
  fetchMock.mockResolvedValue(json(200, { ok: true }))
  await expect(api('/wallets', { method: 'POST', body: { name: 'Rent' } })).resolves.toEqual({ ok: true })

  const [url, init] = fetchMock.mock.calls[0]!
  expect(url).toBe('https://api.test/v1/wallets')
  expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer session-token')
  expect(init?.body).toBe('{"name":"Rent"}')
})

test('builds query strings and drops empty values', async () => {
  fetchMock.mockResolvedValue(json(200, []))
  await api('/transactions', { query: { page: 2, search: '', status: undefined, from: '2026-11-01' } })
  expect(fetchMock.mock.calls[0]![0]).toBe('https://api.test/v1/transactions?page=2&from=2026-11-01')
})

test('an invalid session (401 without a code) signs the user out', async () => {
  fetchMock.mockResolvedValue(json(401, { message: 'Missing or invalid Authorization header', statusCode: 401 }))
  await expect(api('/auth/me')).rejects.toBeInstanceOf(ApiError)
  expect(onUnauthorized).toHaveBeenCalledTimes(1)
})

test('a 401 with a business code (wrong current password) does NOT sign the user out', async () => {
  fetchMock.mockResolvedValue(
    json(401, { message: 'Current password is incorrect', code: 'INVALID_CURRENT_PASSWORD', statusCode: 401 }),
  )
  const error = await api('/auth/password/change', { method: 'POST', body: {} }).catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).code).toBe('INVALID_CURRENT_PASSWORD')
  expect(onUnauthorized).not.toHaveBeenCalled()
})

test('a 401 on a request sent with an explicit token (signup setup token) does not touch the session', async () => {
  fetchMock.mockResolvedValue(json(401, { message: 'Expired', statusCode: 401 }))
  await expect(api('/auth/password/set', { method: 'POST', token: 'setup-token' })).rejects.toBeInstanceOf(ApiError)
  expect(new Headers(fetchMock.mock.calls[0]![1]?.headers).get('Authorization')).toBe('Bearer setup-token')
  expect(onUnauthorized).not.toHaveBeenCalled()
})

test('NestJS validation arrays become readable details', async () => {
  fetchMock.mockResolvedValue(json(400, { message: ['email must be an email', 'code is required'], statusCode: 400 }))
  const error = (await api('/auth/email/verify').catch((e: unknown) => e)) as ApiError
  expect(error.status).toBe(400)
  expect(error.details).toEqual(['email must be an email', 'code is required'])
})

test('a failed connection is a NetworkError, not an ApiError', async () => {
  fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
  await expect(api('/dashboard/summary')).rejects.toBeInstanceOf(NetworkError)
})
