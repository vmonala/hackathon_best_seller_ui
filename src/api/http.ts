import { API_BASE_URL } from './config'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type QueryValue = string | number | boolean | undefined | null | Array<string | number>

export function buildQueryString(params: Record<string, QueryValue>): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      // FastAPI reads repeated keys into List[...] params.
      for (const v of value) sp.append(key, String(v))
    } else {
      sp.set(key, String(value))
    }
  }
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

type ApiRequestInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
  params?: Record<string, QueryValue>
}

export async function apiFetch<T>(
  path: string,
  init?: ApiRequestInit,
): Promise<T> {
  const { params, ...rest } = init ?? {}
  const url = `${API_BASE_URL}${path}${params ? buildQueryString(params) : ''}`

  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...rest.headers,
    },
  })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text().catch(() => undefined)
    }
    // FastAPI puts validation/HTTPException messages in `detail`.
    const detail =
      body && typeof body === 'object' && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : res.statusText
    throw new ApiError(detail, res.status, body)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
