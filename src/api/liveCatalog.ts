import { apiFetch } from './http'
import type { CatalogPage } from './backend'
import type { SegmentFeatureRow } from './backend'
import { buildCatalog, type LiveCatalog } from './adapters/catalog'

/**
 * `GET /v1/segments` can only page the catalog — it takes no search, filter or
 * sort params, and there is no per-segment or facets route. So the whole dump
 * is pulled once, mapped, and cached for the lifetime of the tab; every filter,
 * sort, facet count and detail view is then served from memory.
 *
 * At the API's maximum page size that is ~74 requests for ~14.6k rows. The raw
 * payload is ~19MB, but only the mapped `Segment` objects are retained — the
 * platform-name arrays each row carries are collapsed into destinations and
 * counts and then dropped.
 */

/** The endpoint caps page_size at 200. */
const PAGE_SIZE = 200
/** Parallel page fetches. Enough to be quick without hammering the dev server. */
const CONCURRENCY = 6

let cached: Promise<LiveCatalog> | null = null

export function loadCatalog(): Promise<LiveCatalog> {
  // A failed load must not be cached, or the app can never recover from a
  // backend that was briefly down.
  cached ??= fetchCatalog().catch((err) => {
    cached = null
    throw err
  })
  return cached
}

/** Drops the cached catalog so the next read re-fetches. */
export function invalidateCatalog() {
  cached = null
}

function fetchPage(page: number) {
  return apiFetch<CatalogPage>('/segments', {
    params: { page, page_size: PAGE_SIZE },
  })
}

async function fetchCatalog(): Promise<LiveCatalog> {
  const first = await fetchPage(1)
  const { total_pages: totalPages } = first.pagination

  // Page 1 already covers the whole catalog, or the server reported nothing.
  if (totalPages <= 1) return buildCatalog(first.items)

  const pages: SegmentFeatureRow[][] = new Array(totalPages)
  pages[0] = first.items

  let next = 2
  const worker = async () => {
    for (let page = next++; page <= totalPages; page = next++) {
      const res = await fetchPage(page)
      pages[page - 1] = res.items
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, totalPages - 1) }, worker),
  )

  return buildCatalog(pages.flatMap((rows) => rows ?? []))
}
