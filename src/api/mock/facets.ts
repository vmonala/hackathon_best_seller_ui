import { CATALOG } from './segments'

/**
 * Filter facets and their counts.
 *
 * Derived from the catalogue rather than hand-authored: with the real capture
 * in hand, a count that disagrees with the rows it filters to is just a bug
 * waiting to confuse someone. `deriveFacets` in `adapters/catalog.ts` builds
 * them, and drops any label no row in the catalogue earned.
 */
export const MOCK_FACETS = CATALOG.facets
