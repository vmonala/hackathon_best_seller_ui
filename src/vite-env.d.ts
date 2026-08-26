/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Simulated request latency in ms, so loading states are visible. */
  readonly VITE_MOCK_LATENCY_MS?: string
  /** "false" hides the derived catalogue columns (rate card, CPC, media share). */
  readonly VITE_SYNTHETIC_CATALOG_METRICS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
