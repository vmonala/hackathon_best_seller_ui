import { LABEL_ORDER } from '@/lib/labels'
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

/**
 * Label and destination narrowing, counted separately for the footer.
 */
function matchesLabelFilters(segment: Segment, query: SegmentQuery) {
  const { labels = [], destinations = [] } = query
  // Labels are OR-ed: selecting two labels widens the result set, which is what
  // the independent per-label facet counts imply.
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

const labelRank = new Map(LABEL_ORDER.map((l, i) => [l, i]))

/**
 * Compares two segments by their label *set*, so segments that earned the same
 * labels land next to each other.
 *
 * The set is read as a priority-ordered vector — a segment carrying
 * `[best_seller, active_platforms]` compares as `[1, 3]` — and the vectors are
 * compared position by position, exactly the way a version number is. That puts
 * every "best seller + multi-platform" row in one block, the next combination
 * in the block below, and segments with no labels at the end regardless of
 * direction: a "no labels" group at the top of the default view would bury the
 * whole point of the page.
 *
 * Where the vectors agree up to the length of the shorter one, the longer set
 * ranks first — more labels earned is the stronger row.
 */
function compareLabelSets(a: Segment, b: Segment) {
  if (!a.labels.length || !b.labels.length) {
    return a.labels.length === b.labels.length ? 0 : a.labels.length ? -1 : 1
  }
  const rank = (l: string) => labelRank.get(l as never) ?? LABEL_ORDER.length
  for (let i = 0; i < Math.min(a.labels.length, b.labels.length); i++) {
    const diff = rank(a.labels[i]) - rank(b.labels[i])
    if (diff) return diff
  }
  return b.labels.length - a.labels.length
}

function sortSegments(rows: Segment[], query: SegmentQuery): Segment[] {
  const { sort = 'labels', direction = 'desc' } = query
  const dir = direction === 'asc' ? 1 : -1

  return [...rows].sort((a, b) => {
    switch (sort) {
      case 'labels': {
        // `desc` — the default — reads strongest label set first, and `asc`
        // flips the blocks. Either way the unlabelled block stays last, and
        // rows inside a block read strongest-first, which is what makes a
        // block scannable.
        const grouped = compareLabelSets(a, b)
        if (!grouped) return b.marketplaceScore - a.marketplaceScore
        const bothLabelled = a.labels.length > 0 && b.labels.length > 0
        return bothLabelled && direction === 'asc' ? -grouped : grouped
      }
      case 'cpc':
        return (a.cpc - b.cpc) * dir
      case 'cookie_reach':
        return (a.cookieReach - b.cookieReach) * dir
      case 'impressions':
        return ((a.impressions90d ?? 0) - (b.impressions90d ?? 0)) * dir
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
  const matched = sortSegments(base.filter((s) => matchesLabelFilters(s, query)), query)

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
