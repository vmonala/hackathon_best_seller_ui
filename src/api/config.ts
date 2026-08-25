export type ApiMode = 'mock' | 'live'

/**
 * Independently switchable slices of the API. Each one can read from fixtures
 * or from FastAPI, so a module whose endpoints aren't built yet can stay on
 * mock data while the rest of the app talks to the real backend.
 */
export type ApiModule = 'segments' | 'discovery' | 'seller'

export const API_MODULES: ApiModule[] = ['segments', 'discovery', 'seller']

export const API_MODULE_LABELS: Record<ApiModule, string> = {
  segments: 'Marketplace segments',
  discovery: 'AI discovery',
  seller: 'Data Seller Insights',
}

function parseMode(value: unknown): ApiMode | undefined {
  return value === 'live' || value === 'mock' ? value : undefined
}

/** Fallback for any module without its own override. */
const DEFAULT_MODE: ApiMode = parseMode(import.meta.env.VITE_API_MODE) ?? 'mock'

/**
 * Per-module overrides. Vite only inlines statically-referenced env keys, so
 * these have to be spelled out rather than built from the module name.
 */
const OVERRIDES: Record<ApiModule, ApiMode | undefined> = {
  segments: parseMode(import.meta.env.VITE_API_MODE_SEGMENTS),
  discovery: parseMode(import.meta.env.VITE_API_MODE_DISCOVERY),
  seller: parseMode(import.meta.env.VITE_API_MODE_SELLER),
}

export const API_MODES: Record<ApiModule, ApiMode> = {
  segments: OVERRIDES.segments ?? DEFAULT_MODE,
  discovery: OVERRIDES.discovery ?? DEFAULT_MODE,
  seller: OVERRIDES.seller ?? DEFAULT_MODE,
}

export function apiModeFor(module: ApiModule): ApiMode {
  return API_MODES[module]
}

export const MOCKED_MODULES = API_MODULES.filter((m) => API_MODES[m] === 'mock')

/**
 * Whole-app mode, kept for callers that just want one answer: 'live' only when
 * every module is live, 'mock' otherwise.
 */
export const API_MODE: ApiMode = MOCKED_MODULES.length ? 'mock' : 'live'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const MOCK_LATENCY_MS = Number(
  import.meta.env.VITE_MOCK_LATENCY_MS ?? 250,
)
