export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly details: string[]

  constructor(status: number, message: string, code?: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Network request failed', { cause })
    this.name = 'NetworkError'
  }
}

type ApiConfig = {
  baseUrl: string
  getToken: () => string | null
  onUnauthorized: () => void
}

let config: ApiConfig = { baseUrl: '', getToken: () => null, onUnauthorized: () => {} }

export function configureApi(next: ApiConfig) {
  config = next
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  formData?: FormData
  query?: QueryParams
  token?: string
  signal?: AbortSignal
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${config.baseUrl}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

type ErrorBody = { message?: string | string[]; code?: string; error?: string }

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const type = response.headers.get('Content-Type') ?? ''
  if (type.includes('application/json')) return response.json()
  return response.text()
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, query, token, signal } = options
  const usingSession = token === undefined
  const bearer = token ?? config.getToken()

  const headers = new Headers({ Accept: 'application/json' })
  if (bearer) headers.set('Authorization', `Bearer ${bearer}`)
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new NetworkError(error)
  }

  const data = await readBody(response).catch(() => undefined)
  if (response.ok) return data as T

  const errorBody = (typeof data === 'object' && data !== null ? data : {}) as ErrorBody
  const details = Array.isArray(errorBody.message) ? errorBody.message : []
  const message =
    typeof errorBody.message === 'string' ? errorBody.message : (details[0] ?? errorBody.error ?? response.statusText)

  if (response.status === 401 && usingSession && bearer && !errorBody.code) {
    config.onUnauthorized()
  }
  throw new ApiError(response.status, message, errorBody.code, details)
}
