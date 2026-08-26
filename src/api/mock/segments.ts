import { buildCatalog } from '../adapters/catalog'
import { CATALOG_ROWS, LABEL_VOCABULARY } from './catalogRows'

/**
 * The marketplace catalogue the app renders.
 *
 * This used to be twenty hand-authored `Segment` objects. It is now the real
 * catalogue — the data team's smartwatch dump plus the earlier API capture, both
 * in `./catalogRows` — run through the same adapter that used to sit in front of
 * the live backend. Two things follow from that:
 *
 *   - Every figure on screen is either a value the API actually served, or a
 *     documented derivation from one — nothing is invented row by row.
 *   - `adapters/catalog.ts` stays on the critical path, so the mapping is
 *     exercised by ordinary use rather than only in live mode.
 *
 * Built once at module load: 68 rows, and the work is percentile arithmetic
 * over them.
 */
export const CATALOG = buildCatalog(CATALOG_ROWS, LABEL_VOCABULARY)

export const MOCK_SEGMENTS = CATALOG.segments

/**
 * Catalogue-level counters shown in the table footer.
 *
 * The captured rows are one slice of a much larger marketplace — their own
 * `reach_rank` runs past 80,000 — so the footer quotes the scale of the
 * catalogue the ranks were computed over rather than the size of this capture,
 * which is what the ranks on screen mean.
 */
export const MOCK_CATALOG_TOTALS = {
  filteredTotal: CATALOG_ROWS.length,
  catalogTotal: 930_251,
}
