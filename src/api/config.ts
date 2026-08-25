export type ApiMode = 'mock' | 'live'

export const API_MODE: ApiMode =
  (import.meta.env.VITE_API_MODE as ApiMode | undefined) ?? 'mock'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const MOCK_LATENCY_MS = Number(
  import.meta.env.VITE_MOCK_LATENCY_MS ?? 250,
)
