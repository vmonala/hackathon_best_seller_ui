import type { Paginated, Segment, SegmentQuery } from './types'

/**
 * Search / filter / sort / paginate over an in-memory `Segment[]`.
 *
 * Both data sources run through here: the fixtures, and the live catalog once
 * it has been pulled into memory. The `/v1/segments` endpoint only takes `page`
 * and `page_size`, so every filter the UI offers has to be applied client-side
 * anyway — sharing one implementation keeps mock and live results identical.
 */

export const DEFAULT_PAGE_SIZE = 25

function matchesSearch(segment: Segment, search?: string) {
  if (!search) return true
  const q = search.toLowerCase().trim()
  if (!q) return true
  const path = segment.fullPath.toLowerCase()
  return (
    path.includes(q) ||
    segment.seller.toLowerCase().includes(q) ||
    segment.id.includes(q) ||
    // Loose token match so "smart watch" also hits "Smartwatch".
    path.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
  )
}

/** Filters that describe the segment itself, independent of its performance. */
function matchesBaseFilters(segment: Segment, query: SegmentQuery) {
  const { search, sellers = [], statuses = [] } = query
  if (!matchesSearch(segment, search)) return false
  if (sellers.length && !sellers.includes(segment.seller)) return false
  if (statuses.length && !statuses.includes(segment.status)) return false
  return true
}

/** Performance-label and destination narrowing, counted separately for the footer. */
function matchesLabelFilters(segment: Segment, query: SegmentQuery) {
  const { labels = [], destinations = [] } = query
  // Performance labels are OR-ed: selecting two labels widens the result set,
  // which is what the independent per-label facet counts imply.
  if (labels.length && !labels.some((l) => segment.labels.includes(l))) return false
  // Destinations are AND-ed: "proven on Facebook AND Snapchat" is the
  // activation question buyers are actually asking.
  if (
    destinations.length &&
    !destinations.every((d) =>
      segment.destinations.some((sd) => sd.destination === d && sd.live),
    )
  )
    return false
  return true
}

function sortSegments(rows: Segment[], query: SegmentQuery): Segment[] {
  const { sort = 'marketplace_score', direction = 'desc' } = query
  const dir = direction === 'asc' ? 1 : -1

  return [...rows].sort((a, b) => {
    switch (sort) {
      case 'cpc':
        return (a.cpc - b.cpc) * dir
      case 'cookie_reach':
        return (a.cookieReach - b.cookieReach) * dir
      case 'date_added':
        return (Date.parse(a.dateAdded) - Date.parse(b.dateAdded)) * dir
      case 'name':
        return a.name.localeCompare(b.name) * dir
      case 'marketplace_score':
      default:
        return (a.marketplaceScore - b.marketplaceScore) * dir
    }
  })
}

/**
 * Full list query against an in-memory catalog. `totalUnfiltered` reports the
 * size of `rows`; callers standing in for a larger catalogue can override it.
 */
export function runSegmentQuery(
  rows: Segment[],
  query: SegmentQuery,
): Paginated<Segment> {
  const base = rows.filter((s) => matchesBaseFilters(s, query))
  const matched = sortSegments(
    base.filter((s) => matchesLabelFilters(s, query)),
    query,
  )

  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(matched.length / pageSize))
  // A `page` left over in the URL from a wider filter would otherwise return an
  // empty page that reads as "no matches". Clamp so the last page is served.
  const page = Math.min(Math.max(1, query.page ?? 1), totalPages)
  const start = (page - 1) * pageSize

  return {
    items: matched.slice(start, start + pageSize),
    total: matched.length,
    totalUnfiltered: rows.length,
    totalBeforeLabelFilters: base.length,
    page,
    pageSize,
  }
}
