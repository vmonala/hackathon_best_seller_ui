/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'live'
  /** Per-module overrides of VITE_API_MODE — see src/api/config.ts. */
  readonly VITE_API_MODE_SEGMENTS?: 'mock' | 'live'
  readonly VITE_API_MODE_DISCOVERY?: 'mock' | 'live'
  readonly VITE_API_MODE_SELLER?: 'mock' | 'live'
  readonly VITE_API_BASE_URL?: string
  readonly VITE_MOCK_LATENCY_MS?: string
  /** "false" turns off the derived catalogue columns in live mode. */
  readonly VITE_SYNTHETIC_CATALOG_METRICS?: string
  /** Segment Intelligence API — see src/api/config.ts. */
  readonly VITE_TAGS_API_BASE_URL?: string
  readonly VITE_TAGS_ENABLED?: string
  readonly VITE_TAGS_REACH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
