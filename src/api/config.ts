/**
 * App-wide data configuration.
 *
 * There is no live backend anymore. The Segment Intelligence API's catalogue —
 * rows and labels both — was captured into `src/api/mock/catalogRows.ts` and
 * the app reads it from there, so nothing here points at a network origin and
 * no request is issued at runtime. See `src/api/client.ts`.
 */

/** Simulated request latency, so loading states are visible in development. */
export const MOCK_LATENCY_MS = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 250)
