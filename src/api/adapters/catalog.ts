import type { SegmentFeatureRow } from '../backend'
import type {
  DestinationDelivery,
  DestinationId,
  EarnedLabelExplanation,
  FacetOption,
  PerformanceLabel,
  Segment,
  SegmentDetail,
  SegmentFacets,
  SegmentPerformance,
} from '../types'
import { destinationName, registerDestinationName } from '@/lib/labels'

/**
 * Translates `/v1/segments` catalog rows into the `Segment` shape the UI
 * renders.
 *
 * The backend reports *delivered marketplace usage* over a single ~30-day
 * window. It does not report catalogue reach, rate cards, per-buyer channel
 * splits, a creation date, or a prior-period baseline. So:
 *
 *   - `cpc` carries the **effective CPM** (gross data revenue per 1,000
 *     delivered impressions), and `cookieReach` carries **delivered
 *     impressions**. `src/lib/metricLabels.ts` relabels both columns in live
 *     mode so the header matches the number underneath it.
 *   - `advertiserDirectPctOfMedia` carries the share of enabled buyers that
 *     actually delivered, relabelled the same way.
 *   - `trending_up` and `new_gaining_traction` are never awarded: there is no
 *     prior-period baseline and no date-added in the payload to earn them from.
 *   - Every catalog row is marketplace-available; per-user request state lives
 *     in a different system, so `status` is always 'available'.
 *
 * Anything derived from a catalogue-wide percentile (the marketplace score,
 * the `top_performer` and `frequently_reused` cut-offs) needs every row in
 * hand, which is why mapping happens in `buildCatalog` rather than per row.
 */

/** Top-N percentile cut-offs the performance labels are earned from. */
const TOP_PERFORMER_PERCENTILE = 0.05
const FREQUENTLY_REUSED_PERCENTILE = 0.1
/** Delivering platforms needed for "proven multi-platform". */
const MULTI_PLATFORM_MIN = 4

/**
 * Platform names that are the same destination under two spellings. Anything
 * not listed here is *not* dropped — it is slugified into its own destination
 * so every platform the backend reports reaches the UI.
 */
const DESTINATION_ALIASES: Record<string, DestinationId> = {
  snap: 'snapchat',
  twitter: 'x',
  ttd: 'the_trade_desk',
  'trade desk': 'the_trade_desk',
}

/** Stable draw order for the destinations the design names explicitly. */
const DESTINATION_ORDER: DestinationId[] = [
  'facebook',
  'snapchat',
  'tiktok',
  'the_trade_desk',
  'linkedin',
  'pinterest',
  'x',
]

export interface LiveCatalog {
  /** Every row, mapped and ordered strongest-first by marketplace score. */
  segments: Segment[]
  byId: Map<string, { segment: Segment; row: SegmentFeatureRow }>
  facets: SegmentFacets
  /** Catalogue-wide cut-offs the performance labels were earned from. */
  thresholds: { reuseMinBuyers: number }
  /** Usage window the whole dump was computed over. */
  window: { start: string; end: string }
}

function splitPath(fullPath: string) {
  const idx = fullPath.lastIndexOf('>')
  if (idx === -1) return { pathPrefix: '', name: fullPath.trim() }
  return {
    pathPrefix: fullPath.slice(0, idx + 1).trim(),
    name: fullPath.slice(idx + 1).trim(),
  }
}

function pathTokens(fullPath: string) {
  return fullPath
    .split('>')
    .map((p) => p.trim())
    .filter(Boolean)
}

function normalisePlatform(name: string) {
  return name.trim().toLowerCase()
}

/**
 * Turns a payload platform name into a stable destination id, remembering the
 * name it came from so the UI can label it. Unknown platforms get a slug of
 * their own rather than being discarded.
 */
function destinationIdFor(name: string): DestinationId | undefined {
  const normalised = normalisePlatform(name)
  if (!normalised) return undefined

  const id =
    DESTINATION_ALIASES[normalised] ??
    normalised.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (!id) return undefined

  registerDestinationName(id, name.trim())
  return id
}

function mapDestinations(row: SegmentFeatureRow): DestinationDelivery[] {
  const delivering = new Set<DestinationId>()
  const distributed = new Set<DestinationId>()

  for (const name of row.usage_platform_names ?? []) {
    const id = destinationIdFor(name)
    if (id) delivering.add(id)
  }
  for (const name of row.active_platform_names ?? []) {
    const id = destinationIdFor(name)
    if (id) distributed.add(id)
  }

  // Named destinations keep their designed order; everything else follows,
  // alphabetically, so the row is stable across renders.
  const rank = (id: DestinationId) => {
    const i = DESTINATION_ORDER.indexOf(id)
    return i === -1 ? DESTINATION_ORDER.length : i
  }
  const order = (a: DestinationId, b: DestinationId) =>
    rank(a) - rank(b) || destinationName(a).localeCompare(destinationName(b))

  // Delivering destinations first — that is what the label filters and the
  // "proven on destination" facet key off.
  const live = [...delivering].sort(order)
  const idle = [...distributed].filter((id) => !delivering.has(id)).sort(order)

  return [
    ...live.map<DestinationDelivery>((destination) => ({
      destination,
      usage: 'high',
      note: 'delivered impressions in the usage window',
      live: true,
    })),
    ...idle.map<DestinationDelivery>((destination) => ({
      destination,
      usage: 'low',
      note: 'distributed, no delivered impressions',
      live: false,
    })),
  ]
}

/** Gross data revenue per 1,000 delivered impressions. */
function effectiveCpm(row: SegmentFeatureRow) {
  if (row.impressions <= 0) return 0
  return (row.gross_data_revenue / row.impressions) * 1000
}

function deliveringBuyerPct(row: SegmentFeatureRow) {
  if (row.active_buyers <= 0) return 0
  return Math.min(100, Math.round((row.buyers_with_usage / row.active_buyers) * 100))
}

function mapRow(
  row: SegmentFeatureRow,
  marketplaceScore: number,
  labels: PerformanceLabel[],
): Segment {
  const tokens = pathTokens(row.segment_name)
  return {
    id: String(row.dms_segment_id),
    fullPath: row.segment_name,
    ...splitPath(row.segment_name),
    // The payload carries `seller_customer_id`, not a name. The taxonomy root
    // is the provider's own prefix, which is what buyers recognise.
    seller: tokens[0] ?? 'Unknown',
    status: 'available',
    marketplaceScore,
    labels,
    platformCount: row.platforms_with_usage,
    destinations: mapDestinations(row),
    advertiserDirectPctOfMedia: deliveringBuyerPct(row),
    cpc: effectiveCpm(row),
    cookieReach: Math.round(row.impressions),
    // No creation date in the payload; the usage window end is the only date
    // available. The Date Added column is hidden in live mode.
    dateAdded: row.usage_end_date,
    category: tokens[1] ?? tokens[0] ?? 'Uncategorised',
  }
}

function deriveFacets(segments: Segment[]): SegmentFacets {
  const labelCounts = new Map<PerformanceLabel, number>()
  const destCounts = new Map<DestinationId, number>()
  const sellerCounts = new Map<string, number>()

  for (const s of segments) {
    for (const l of s.labels) labelCounts.set(l, (labelCounts.get(l) ?? 0) + 1)
    for (const d of s.destinations) {
      if (d.live) destCounts.set(d.destination, (destCounts.get(d.destination) ?? 0) + 1)
    }
    sellerCounts.set(s.seller, (sellerCounts.get(s.seller) ?? 0) + 1)
  }

  const byCountDesc = <T extends string>(a: FacetOption<T>, b: FacetOption<T>) =>
    b.count - a.count

  return {
    // Only labels the dump can actually award; trending_up and
    // new_gaining_traction need a baseline the API does not expose.
    performanceLabels: (
      ['top_performer', 'frequently_reused', 'proven_multi_platform'] as const
    )
      .map((value) => ({ value, label: LABEL_TEXT[value], count: labelCounts.get(value) ?? 0 }))
      .filter((o) => o.count > 0),
    destinations: [...destCounts]
      .map(([value, count]) => ({ value, label: destinationName(value), count }))
      .sort(byCountDesc),
    sellers: [...sellerCounts]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort(byCountDesc),
    statuses: [
      { value: 'available', label: 'Available', count: segments.length },
    ],
  }
}

const LABEL_TEXT: Record<PerformanceLabel, string> = {
  top_performer: 'Top performer',
  frequently_reused: 'Frequently reused',
  trending_up: 'Trending up',
  proven_multi_platform: 'Proven multi-platform',
  new_gaining_traction: 'New & gaining traction',
}

export function buildCatalog(rows: SegmentFeatureRow[]): LiveCatalog {
  // `popularity_rank` is ranked over a wider pool than the dump contains
  // (max rank exceeds the row count), so rank the rows we actually have.
  const ordered = [...rows].sort((a, b) => a.popularity_rank - b.popularity_rank)
  const n = ordered.length

  const topPerformerCut = Math.ceil(n * TOP_PERFORMER_PERCENTILE)
  const reuseThreshold = percentileThreshold(
    ordered.map((r) => r.buyers_with_usage),
    1 - FREQUENTLY_REUSED_PERCENTILE,
  )

  const byId = new Map<string, { segment: Segment; row: SegmentFeatureRow }>()
  const segments = ordered.map((row, i) => {
    // 100 for the most popular row, 1 for the least, so the score bar and the
    // high/mid/low tone thresholds spread across the whole catalogue.
    const score = n <= 1 ? 100 : Math.max(1, Math.round(100 - (99 * i) / (n - 1)))

    const labels: PerformanceLabel[] = []
    if (i < topPerformerCut) labels.push('top_performer')
    if (row.buyers_with_usage >= reuseThreshold) labels.push('frequently_reused')
    if (row.platforms_with_usage >= MULTI_PLATFORM_MIN) labels.push('proven_multi_platform')

    const segment = mapRow(row, score, labels)
    byId.set(segment.id, { segment, row })
    return segment
  })

  const first = ordered[0]
  return {
    segments,
    byId,
    facets: deriveFacets(segments),
    thresholds: { reuseMinBuyers: reuseThreshold },
    window: {
      start: first?.usage_start_date ?? '',
      end: first?.usage_end_date ?? '',
    },
  }
}

/** Value at `q` (0–1) through the sorted-ascending distribution. */
function percentileThreshold(values: number[], q: number): number {
  if (!values.length) return Number.POSITIVE_INFINITY
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))
  return sorted[idx]
}

/* ---------- Segment detail ---------- */

function daysBetween(start: string, end: string) {
  const ms = Date.parse(`${end}T00:00:00`) - Date.parse(`${start}T00:00:00`)
  return Number.isFinite(ms) ? Math.max(1, Math.round(ms / 86_400_000) + 1) : 0
}

function earnedLabels(
  segment: Segment,
  row: SegmentFeatureRow,
  reuseThreshold: number,
): EarnedLabelExplanation[] {
  const has = (l: PerformanceLabel) => segment.labels.includes(l)
  return [
    {
      label: 'top_performer',
      earned: has('top_performer'),
      explanation: has('top_performer')
        ? `In the **top 5%** of the catalogue by popularity (rank **${row.popularity_rank}**), which pools delivered impressions, revenue and buyer breadth.`
        : `Not earned: popularity rank **${row.popularity_rank}** is outside the **top 5%** of the catalogue.`,
    },
    {
      label: 'frequently_reused',
      earned: has('frequently_reused'),
      explanation: has('frequently_reused')
        ? `**${row.buyers_with_usage}** distinct buyers delivered impressions in the window — the **top 10%** of the catalogue starts at ${reuseThreshold}.`
        : `Not earned: **${row.buyers_with_usage}** buyers delivered impressions, below the **top 10%** cut-off of ${reuseThreshold}.`,
    },
    {
      label: 'proven_multi_platform',
      earned: has('proven_multi_platform'),
      explanation: has('proven_multi_platform')
        ? `Delivered impressions on **${row.platforms_with_usage} platforms**, at or above the **${MULTI_PLATFORM_MIN} platform** threshold.`
        : `Not earned: delivered on **${row.platforms_with_usage} platform${row.platforms_with_usage === 1 ? '' : 's'}**, below the **${MULTI_PLATFORM_MIN} platform** threshold.`,
    },
    {
      label: 'trending_up',
      earned: false,
      explanation:
        'Not available: the catalog reports a single usage window, with no prior-period baseline to measure growth against.',
    },
    {
      label: 'new_gaining_traction',
      earned: false,
      explanation:
        'Not available: the catalog does not report when a segment was added to the marketplace.',
    },
  ]
}

export function buildPerformance(
  segment: Segment,
  row: SegmentFeatureRow,
  catalog: LiveCatalog,
): SegmentPerformance {
  const windowDays = daysBetween(row.usage_start_date, row.usage_end_date)
  const weeks = Math.max(1, Math.round(windowDays / 7))
  // The score *is* the catalogue percentile: 100 for the most popular row.
  const topPct = Math.max(1, 101 - segment.marketplaceScore)

  return {
    segmentId: segment.id,
    marketplaceScore: segment.marketplaceScore,
    scorePercentileNote: `Top ${topPct}% of the catalogue · popularity rank ${row.popularity_rank}`,
    advertisersUsing90d: String(row.buyers_with_usage),
    destinationCount: row.platforms_with_usage,
    // Every catalog row delivered impressions somewhere in the window, and the
    // dump carries no week-by-week breakdown to find gaps in.
    weeksActive: weeks,
    weeksInWindow: weeks,
    // No time series in the payload; PerformanceTab renders an explicit
    // "not reported" state for an empty series.
    usageIndex: [],
    destinations: segment.destinations,
    earnedLabels: earnedLabels(segment, row, catalog.thresholds.reuseMinBuyers),
    evidence: {
      // Confidence in the attribution comes from how many independent buyers
      // and platforms corroborate the usage.
      attributionConfidence:
        row.buyers_with_usage >= 5 && row.platforms_with_usage >= MULTI_PLATFORM_MIN
          ? 'High'
          : row.buyers_with_usage >= 2
            ? 'Medium'
            : 'Low',
      usageDirectlyAttributedPct: segment.advertiserDirectPctOfMedia,
      sharedAdGroupAllocationPct: 100 - segment.advertiserDirectPctOfMedia,
      labelsLastRecomputed: row.usage_end_date,
      reportingWindowStart: row.usage_start_date,
      reportingWindowEnd: row.usage_end_date,
    },
  }
}

export function buildSegmentDetail(
  entry: { segment: Segment; row: SegmentFeatureRow },
  catalog: LiveCatalog,
): SegmentDetail {
  return {
    ...entry.segment,
    performance: buildPerformance(entry.segment, entry.row, catalog),
  }
}
