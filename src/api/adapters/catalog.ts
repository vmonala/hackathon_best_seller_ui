import type { SegmentFeatureRow, SegmentLabelRow } from '../backend'
import type {
  DestinationDelivery,
  DestinationId,
  EarnedLabelExplanation,
  FacetOption,
  LabelDefinition,
  Segment,
  SegmentDetail,
  SegmentFacets,
  SegmentLabel,
  SegmentPerformance,
  UsageLevel,
} from '../types'
import { destinationName, registerDestinationName } from '@/lib/labels'
import { SYNTHETIC_CATALOG_METRICS } from '@/lib/metricLabels'

/**
 * Translates captured `/v1/segments` catalogue rows into the `Segment` shape
 * the UI renders.
 *
 * The feed reports a segment's **distribution footprint** (which platforms and
 * buyers it is enabled on) and its **measured Connect reach** (cookie, iOS,
 * Android, input records). Both are real numbers straight off the row, which is
 * most of the table:
 *
 *   - `cookieReach`, `iosReach`, `androidReach` and `inputRecords` are
 *     measured, so `reachMeasured` is true and the columns are not footnoted as
 *     estimates.
 *   - `platformCount` and `destinations` come from `active_platforms` and
 *     `active_platform_names`, sized by `reach_by_platform`.
 *
 * Delivered impressions, the commercial figures and the date the segment was
 * added are on the row too — `impressions_90d`, `impressions_prior_90d`,
 * `media_spend_90d`, `marketplace_revenue_90d`, `added_at` — but they are
 * generated for the fixture rather than captured, which is where the spend,
 * revenue, impressions and lifecycle labels read from. See the docblock in
 * `mock/catalogRows.ts`.
 *
 * What the feed carries *no* signal for at all is pricing. So:
 *
 *   - `cpc` and `advertiserDirectPctOfMedia` are **derived stand-ins**, not
 *     measurements. See `synthesiseCatalogAttributes`.
 *   - Every catalogue row is marketplace-available; per-user request state
 *     lives in a different system, so `status` is always 'available'.
 *
 * Labels come off the row's own `label_keys`, which the fixture computed from
 * catalogue-wide and per-cohort cut-offs. What this module adds is the *reason* each one was
 * awarded to a given segment, quoting that segment's numbers — see
 * `explainLabel`. The cut-offs it quotes need every row in hand, which is why
 * mapping happens in `buildCatalog` rather than per row.
 */

/** Top-N percentile cut-off the spend, revenue and impressions labels use. */
const TOP_PERCENTILE = 0.05
/** Active platforms needed for the `active_platforms` label. */
const MULTI_PLATFORM_MIN = 4
/** Buyers a segment needs for `best_seller` and `new_addition_trending`. */
const MIN_BUYERS = 5
/** How recently a segment must have been added to count as new. */
const NEW_WINDOW_DAYS = 90
/** How long a segment must have gone unused before it reads as dormant. */
const DORMANT_AFTER_DAYS = 182
/** The date the catalogue's `added_at` values and the new window are measured against. */
const CATALOG_AS_OF = '2026-08-26'

/**
 * Platform names that are the same destination under two spellings. Anything
 * not listed here is *not* dropped — it is slugified into its own destination
 * so every platform the feed reports reaches the UI.
 */
const DESTINATION_ALIASES: Record<string, DestinationId> = {
  snap: 'snapchat',
  twitter: 'x',
  ttd: 'the_trade_desk',
  'trade desk': 'the_trade_desk',
  'the trade desk': 'the_trade_desk',
  'google | data marketplace': 'google',
  'yahoo! (fka verizon media)': 'yahoo',
  'nexxen (fka amobee)': 'nexxen',
  'magnite dv+ (rubicon project)': 'magnite',
  'tapad (a part of experian)': 'tapad',
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
  /** The catalogue-wide cut-offs the labels were earned from. */
  thresholds: LabelThresholds
  /** The vocabulary, strongest first — the label filter's option list. */
  vocabulary: LabelDefinition[]
  /** The freshest reach measurement date across the catalogue. */
  reachAsOf: string
}

/**
 * The cut-offs the percentile labels were awarded against, kept so the reason
 * on a chip can quote the number the segment had to beat.
 */
export interface LabelThresholds {
  /** Catalogue-wide media spend the top 5% starts at. */
  topSpendMin: number
  /** Per-cohort cut-offs, keyed by the cohort name `cohortOf` returns. */
  cohorts: Map<string, CohortThresholds>
}

/** The cut-offs inside one category cohort, and how big that cohort is. */
export interface CohortThresholds {
  /** Segments in the cohort, i.e. what the 5% was taken over. */
  size: number
  /** 90-day Marketplace revenue the cohort's top 5% starts at. */
  bestSellerMinRevenue: number
  /** 90-day impressions the cohort's top 5% starts at. */
  topImpressionsMin: number
}

/**
 * The peer group a segment is measured against: its two-token taxonomy branch,
 * e.g. "Retail > Consumer Electronics". Ranking a wearables segment against the
 * whole catalogue would mostly measure how big its category is; ranking it
 * against its own branch measures the segment.
 */
export function cohortOf(fullPath: string): string {
  const t = pathTokens(fullPath)
  return [t[1] ?? t[0] ?? 'Uncategorised', t[2]].filter(Boolean).join(' > ')
}

/**
 * The value that starts the top `pct` of a distribution, rounding the cut up so
 * a small cohort still awards one winner rather than none.
 */
function topCut(values: number[], pct: number): number {
  const positive = values.filter((v) => v > 0)
  if (!positive.length) return Number.POSITIVE_INFINITY
  const sorted = [...positive].sort((a, b) => b - a)
  const cut = Math.min(sorted.length, Math.max(1, Math.ceil(values.length * pct)))
  return sorted[cut - 1]
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

/** The bare date out of an ISO timestamp, or undefined if there isn't one. */
function isoDate(timestamp: string | null | undefined) {
  return timestamp ? timestamp.slice(0, 10) : undefined
}

/**
 * Turns a payload platform name into a stable destination id, remembering the
 * name it came from so the UI can label it. Unknown platforms get a slug of
 * their own rather than being discarded.
 */
function destinationIdFor(name: string): DestinationId | undefined {
  const normalised = name.trim().toLowerCase()
  if (!normalised) return undefined

  const id =
    DESTINATION_ALIASES[normalised] ??
    normalised.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (!id) return undefined

  registerDestinationName(id, name.trim())
  return id
}

/**
 * The segment's active platforms, sized by how much of its reach each one
 * carries.
 *
 * `reach_by_platform` is the only per-destination number in the feed, so the
 * usage dots are scaled against the row's own strongest platform rather than
 * against the catalogue — the question the dots answer is "where is this
 * segment biggest", not "is this platform big".
 *
 * Every active platform is `live`: the feed reports the current enabled
 * distribution footprint, and carries no separate delivered-impressions signal
 * that could distinguish an idle distribution from a working one.
 */
function mapDestinations(row: SegmentFeatureRow): DestinationDelivery[] {
  const reachFor = row.reach_by_platform ?? {}
  const peak = Math.max(0, ...Object.values(reachFor))

  const level = (reach: number): UsageLevel => {
    if (!peak) return 'moderate'
    const share = reach / peak
    if (share >= 0.9) return 'very_high'
    if (share >= 0.75) return 'high'
    if (share >= 0.55) return 'moderate'
    return 'low'
  }

  const rank = (id: DestinationId) => {
    const i = DESTINATION_ORDER.indexOf(id)
    return i === -1 ? DESTINATION_ORDER.length : i
  }

  return (row.active_platform_names ?? [])
    .flatMap((name) => {
      const destination = destinationIdFor(name)
      if (!destination) return []
      const reach = reachFor[name] ?? 0
      return [
        {
          destination,
          usage: level(reach),
          note: reach
            ? `${formatCompact(reach)} estimated reach on this platform`
            : 'distributed, reach not reported',
          live: true,
        } satisfies DestinationDelivery,
      ]
    })
    // Strongest first, so the dots read left-to-right by size; named
    // destinations break ties in their designed order.
    .sort(
      (a, b) =>
        USAGE_WEIGHT[b.usage] - USAGE_WEIGHT[a.usage] ||
        rank(a.destination) - rank(b.destination) ||
        destinationName(a.destination).localeCompare(destinationName(b.destination)),
    )
}

const USAGE_WEIGHT: Record<UsageLevel, number> = {
  very_high: 3,
  high: 2,
  moderate: 1,
  low: 0,
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

/**
 * Illustrative pricing and media-mix attributes.
 *
 * The rate card and the advertiser-direct media share are commercial attributes
 * the catalogue feed does not report — it carries distribution, reach and
 * delivered impressions only. Rather than leaving a third of the table empty,
 * each one is derived from figures the row *does* carry, at the ratios the
 * design comps use. Two consequences worth knowing:
 *
 *   - Every value is a deterministic function of the row, so it is stable
 *     across renders, sorts and pages — no reshuffling numbers.
 *   - None of it is measured. The column picker tags these columns "estimated"
 *     and a footnote under the table says so. `VITE_SYNTHETIC_CATALOG_METRICS=false`
 *     turns them off and shows only what the feed actually reports.
 *
 * The measured reach columns and Date Added are *not* in here — those come
 * straight off the row in `mapRow`.
 */
const RATE_CARD_OVER_EFFECTIVE = 1.35
const CPM_CAP_MULTIPLE = 2.02

/** Price band the derived CPC spans, in dollars per click. */
const CPC_FLOOR = 0.16
const CPC_SCARCITY_PREMIUM = 0.22
const CPC_DEMAND_PREMIUM = 0.09

const DATA_SOURCE_METHODS = ['Declared', 'Modelled', 'Observed'] as const
const PRECISION_LEVELS = ['Household', 'Individual'] as const

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/** Stable pseudo-random index into `length`, drawn from the segment id. */
function pick(id: number, length: number) {
  return Math.abs(id) % length
}

/**
 * A derived CPC, in dollars.
 *
 * Priced the way a scarce audience is: a floor, plus a premium for being small
 * relative to the catalogue (`scarcity`, 1 for the narrowest row), plus a
 * smaller premium for being in demand across many buyers (`demand`).
 */
function deriveCpc(scarcity: number, demand: number) {
  return round2(
    CPC_FLOOR + CPC_SCARCITY_PREMIUM * scarcity + CPC_DEMAND_PREMIUM * demand,
  )
}

/** The share a segment on a single platform is given, and the drop per platform. */
const DIRECT_PCT_CEILING = 34
const DIRECT_PCT_PER_PLATFORM = 3

/**
 * A derived advertiser-direct share of media, as a percentage.
 *
 * Stands in for "how much of this segment's media is bought directly rather
 * than through a platform's own marketplace", and falls as the footprint widens:
 * a segment on one platform is mostly a direct relationship, one on nine is
 * mostly flowing through those platforms' own marketplaces.
 *
 * Note it is keyed on the platform count alone, not on a buyers-per-platform
 * ratio. `active_buyers`, `active_platforms` and `active_destination_accounts`
 * are equal on every row in this catalogue — one buyer, one account, one
 * platform — so any ratio between them is the constant 1 and would flatten this
 * to a single value for all eighteen rows.
 */
function deriveAdvertiserDirectPct(row: SegmentFeatureRow) {
  const platforms = Math.max(1, row.active_platforms)
  return Math.max(
    4,
    DIRECT_PCT_CEILING - DIRECT_PCT_PER_PLATFORM * (platforms - 1),
  )
}

function synthesiseCatalogAttributes(
  row: SegmentFeatureRow,
  segment: Segment,
): Partial<Segment> {
  const id = row.dms_segment_id
  // A list rate sits above the realised CPC: not every impression bills at the
  // top of the rate card.
  const cpm = round2(segment.cpc * RATE_CARD_OVER_EFFECTIVE * 11.25)

  return {
    cpm,
    cpmCap: round2(cpm * CPM_CAP_MULTIPLE),
    programmaticPctOfMedia: Math.min(
      100,
      segment.advertiserDirectPctOfMedia + 4 + pick(id, 7),
    ),
    dataSourceMethod: DATA_SOURCE_METHODS[pick(id, DATA_SOURCE_METHODS.length)],
    dataSourceDetail:
      row.segment_type === 'Standard' ? 'Syndicated taxonomy' : row.segment_type,
    precisionLevel: PRECISION_LEVELS[pick(id, PRECISION_LEVELS.length)],
  }
}

function mapLabelDefinition(row: SegmentLabelRow): LabelDefinition {
  return {
    key: row.label_key as SegmentLabel,
    name: row.display_name,
    description: row.description,
    category: row.category,
    priority: row.priority,
  }
}

interface RowContext {
  marketplaceScore: number
  labels: SegmentLabel[]
  labelReasons: Partial<Record<SegmentLabel, string>>
  /** 1 for the narrowest cookie reach in the catalogue, 0 for the widest. */
  scarcity: number
  /** 1 for the most widely bought row, 0 for the least. */
  demand: number
}

function mapRow(row: SegmentFeatureRow, ctx: RowContext): Segment {
  const tokens = pathTokens(row.segment_name)
  // Reach is measured, and this timestamp dates both the reach figures and the
  // refresh. It is *not* the created date — `added_at` is a field of its own.
  const measuredOn = isoDate(row.cookie_reach_updated_at) ?? ''

  const segment: Segment = {
    id: String(row.dms_segment_id),
    fullPath: row.segment_name,
    ...splitPath(row.segment_name),
    // The payload carries `seller_customer_id`, not a name. The taxonomy root
    // is the provider's own prefix, which is what buyers recognise.
    seller: tokens[0] ?? 'Unknown',
    status: 'available',
    marketplaceScore: ctx.marketplaceScore,
    labels: ctx.labels,
    labelReasons: ctx.labelReasons,
    platformCount: row.active_platforms,
    destinations: mapDestinations(row),
    category: tokens[1] ?? tokens[0] ?? 'Uncategorised',
    description: row.segment_description ?? undefined,
    segmentType: row.segment_type,

    // Measured, straight off the row.
    cookieReach: row.cookie_reach,
    iosReach: row.ios_reach,
    androidReach: row.android_reach,
    inputRecords: row.input_records,
    reachMeasured: true,
    reachAsOf: measuredOn,
    inputRecordsAsOf: measuredOn,
    dateLastRefreshed: measuredOn,
    dateAdded: row.added_at,
    impressions90d: row.impressions_90d,
    // 0 on the row means "no comparable prior period", which is a different
    // statement from "nothing delivered" — so it becomes absent here, and the
    // growth figure it would feed is absent with it.
    impressionsPrior90d: row.impressions_prior_90d || undefined,
    impressionsGrowthPct: row.impressions_prior_90d
      ? Math.round(
          ((row.impressions_90d - row.impressions_prior_90d) /
            row.impressions_prior_90d) *
            100,
        )
      : undefined,

    // Derived — see `synthesiseCatalogAttributes`.
    cpc: deriveCpc(ctx.scarcity, ctx.demand),
    advertiserDirectPctOfMedia: deriveAdvertiserDirectPct(row),
  }

  // The rate card, the programmatic media share and provenance are not in this
  // feed. Off, they render "-"; on, they carry a derived stand-in so the table
  // is not half empty.
  return SYNTHETIC_CATALOG_METRICS
    ? { ...segment, ...synthesiseCatalogAttributes(row, segment) }
    : segment
}

function deriveFacets(
  segments: Segment[],
  vocabulary: LabelDefinition[],
): SegmentFacets {
  const labelCounts = new Map<SegmentLabel, number>()
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
    (b.count ?? 0) - (a.count ?? 0)

  return {
    // The whole vocabulary in priority order, minus anything no row earned —
    // an option that can only ever return nothing is noise in the dropdown.
    // The criteria rides along as the option's hint.
    labels: vocabulary
      .map((definition) => ({
        value: definition.key,
        label: definition.name,
        count: labelCounts.get(definition.key) ?? 0,
        hint: definition.description,
      }))
      .filter((o) => o.count > 0),
    destinations: [...destCounts]
      .map(([value, count]) => ({ value, label: destinationName(value), count }))
      .sort(byCountDesc),
    sellers: [...sellerCounts]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort(byCountDesc),
    statuses: [{ value: 'available', label: 'Available', count: segments.length }],
  }
}

/**
 * Where `value` sits in `values`, as 0 (lowest) to 1 (highest). Returns 0 for a
 * single-valued distribution, which is the neutral end of every premium it
 * feeds.
 */
function normalise(value: number, values: number[]) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  return hi === lo ? 0 : (value - lo) / (hi - lo)
}

export function buildCatalog(
  rows: SegmentFeatureRow[],
  vocabularyRows: SegmentLabelRow[],
): LiveCatalog {
  const vocabulary = vocabularyRows
    .map(mapLabelDefinition)
    .sort((a, b) => a.priority - b.priority)
  const priorityOf = new Map(vocabulary.map((d) => [d.key, d.priority]))

  // `reach_rank` and `distribution_rank` are ranked over the API's whole
  // catalogue (ranks run into the tens of thousands), not over the rows on
  // hand — so the score has to re-rank what we actually have. Reach and
  // distribution weigh equally: a segment is a "best seller" for being both big
  // and widely bought, and neither alone.
  const popularity = (r: SegmentFeatureRow) => r.reach_rank + r.distribution_rank
  const ordered = [...rows].sort((a, b) => popularity(a) - popularity(b))
  const n = ordered.length

  const cookieReaches = ordered.map((r) => r.cookie_reach)
  const buyerCounts = ordered.map((r) => r.active_buyers)

  // The cut-offs the fixture awarded the percentile labels from, recomputed here
  // so a reason can quote the number the segment had to beat. Same rows, same
  // cohorts, same percentile function, so they agree by construction.
  const byCohort = new Map<string, SegmentFeatureRow[]>()
  for (const row of ordered) {
    const cohort = cohortOf(row.segment_name)
    const group = byCohort.get(cohort)
    if (group) group.push(row)
    else byCohort.set(cohort, [row])
  }

  const thresholds: LabelThresholds = {
    topSpendMin: topCut(
      ordered.map((r) => r.media_spend_90d),
      TOP_PERCENTILE,
    ),
    cohorts: new Map(
      [...byCohort].map(([cohort, group]) => [
        cohort,
        {
          size: group.length,
          bestSellerMinRevenue: topCut(
            group.map((r) => r.marketplace_revenue_90d),
            TOP_PERCENTILE,
          ),
          topImpressionsMin: topCut(
            group.map((r) => r.impressions_90d),
            TOP_PERCENTILE,
          ),
        },
      ]),
    ),
  }

  const byId = new Map<string, { segment: Segment; row: SegmentFeatureRow }>()
  const segments = ordered.map((row, i) => {
    // 100 for the most popular row, 1 for the least, so the score bar and the
    // high/mid/low tone thresholds spread across the whole catalogue.
    const marketplaceScore =
      n <= 1 ? 100 : Math.max(1, Math.round(100 - (99 * i) / (n - 1)))

    // Awarded on the row rather than recomputed here: `label_keys` is what the
    // catalogue published, and re-deriving it would let the chips disagree with
    // the fixture's own cut-offs. A key the vocabulary does not define is
    // dropped — it has no wording to draw and no criteria to explain.
    const labels = row.label_keys
      .filter((key): key is SegmentLabel => priorityOf.has(key as SegmentLabel))
      .sort((a, b) => priorityOf.get(a)! - priorityOf.get(b)!)

    const labelReasons: Partial<Record<SegmentLabel, string>> = {}
    for (const label of labels) labelReasons[label] = explainLabel(label, row, thresholds)

    const segment = mapRow(row, {
      marketplaceScore,
      labels,
      labelReasons,
      scarcity: 1 - normalise(row.cookie_reach, cookieReaches),
      demand: normalise(row.active_buyers, buyerCounts),
    })
    byId.set(segment.id, { segment, row })
    return segment
  })

  const reachDates = rows
    .map((r) => isoDate(r.cookie_reach_updated_at))
    .filter((d): d is string => Boolean(d))
    .sort()

  return {
    segments,
    byId,
    facets: deriveFacets(segments, vocabulary),
    thresholds,
    vocabulary,
    reachAsOf: reachDates.at(-1) ?? '',
  }
}

/* ---------- Why a label was awarded ---------- */

const num = (n: number) => n.toLocaleString('en-US')
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many)

/** Whole days between two ISO dates, `to` minus `from`. */
function daysBetween(from: string, to: string) {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Number.isNaN(ms) ? 0 : Math.round(ms / 86_400_000)
}

/**
 * Why *this* segment earned *this* label, in the segment's own numbers.
 *
 * The vocabulary's `description` states the criteria — "top 5% of its cohort by
 * Marketplace revenue". This is the other half: what the segment actually scored
 * against that cut-off. A buyer looking at a chip wants "$9,400 of revenue, and
 * its cohort's top 5% starts at $4,120", not the rule restated.
 *
 * Markdown bold is used the same way the rest of the drawer copy uses it; the
 * renderers here strip or bold it.
 */
export function explainLabel(
  label: SegmentLabel,
  row: SegmentFeatureRow,
  t: LabelThresholds,
): string {
  const buyers = row.active_buyers
  const platforms = row.active_platforms
  const impressions = row.impressions_90d
  const age = daysBetween(row.added_at, CATALOG_AS_OF)
  const cohort = cohortOf(row.segment_name)
  const cuts = t.cohorts.get(cohort)

  switch (label) {
    case 'top_campaign_spend':
      return `**${usd(row.media_spend_90d)}** of media ran against this segment in the last 90 days — the catalogue's **top 5%** starts at ${usd(t.topSpendMin)}. Buyers are putting real budget behind it, not just testing it.`

    case 'best_seller':
      return `**${usd(row.marketplace_revenue_90d)}** of Marketplace revenue over 90 days, across **${num(buyers)}** ${plural(buyers, 'buyer')} — the **top 5%** of ${cohort} starts at ${usd(cuts?.bestSellerMinRevenue ?? 0)}.`

    case 'most_impressions':
      return `**${num(impressions)}** impressions delivered in the last 90 days — the **top 5%** of ${cohort} starts at ${num(cuts?.topImpressionsMin ?? 0)}. It matches well at the destination.`

    case 'active_platforms':
      return `Distributed to **${num(platforms)} ${plural(platforms, 'platform')}** — ${row.active_platform_names.slice(0, 3).join(', ')}${platforms > 3 ? ` and ${num(platforms - 3)} more` : ''} — at or above the **${MULTI_PLATFORM_MIN} platform** threshold.`

    case 'new_addition_trending':
      return `Added **${num(age)} days ago**, inside the **${NEW_WINDOW_DAYS}-day** window, and already picked up by **${num(buyers)}** ${plural(buyers, 'buyer')}.`

    case 'dormant':
      return `Added **${num(age)} days ago** and **not running on any platform** — no impressions in the last 90 days${row.impressions_prior_90d ? `, down from ${num(row.impressions_prior_90d)} in the 90 before` : ''}.`
  }
}

/* ---------- Segment detail ---------- */

/**
 * The full breakdown: every label in the vocabulary, whether this segment
 * earned it, and why — or, when it did not, how far short it fell.
 *
 * Showing the misses matters as much as showing the hits. "Not a best seller,
 * $1,900 of revenue against a cohort cut-off of $4,120" tells a buyer where the
 * segment sits;
 * omitting the row tells them nothing.
 */
function earnedLabels(
  segment: Segment,
  row: SegmentFeatureRow,
  catalog: LiveCatalog,
): EarnedLabelExplanation[] {
  const t = catalog.thresholds
  const buyers = row.active_buyers
  const platforms = row.active_platforms
  const impressions = row.impressions_90d
  const age = daysBetween(row.added_at, CATALOG_AS_OF)

  const cohort = cohortOf(row.segment_name)
  const cuts = t.cohorts.get(cohort)

  const missed: Record<SegmentLabel, string> = {
    top_campaign_spend: row.media_spend_90d
      ? `Not earned: **${usd(row.media_spend_90d)}** of media ran against it, below the catalogue's **top 5%** cut-off of ${usd(t.topSpendMin)}.`
      : `Not earned: **no media** has run against it in the last 90 days.`,
    best_seller:
      buyers < MIN_BUYERS
        ? `Not earned: **${num(buyers)}** ${plural(buyers, 'buyer')}, below the **${MIN_BUYERS}-buyer** floor — it earned ${usd(row.marketplace_revenue_90d)} of Marketplace revenue over 90 days.`
        : `Not earned: **${usd(row.marketplace_revenue_90d)}** of Marketplace revenue over 90 days, below the **top 5%** of ${cohort}, which starts at ${usd(cuts?.bestSellerMinRevenue ?? 0)}.`,
    most_impressions: `Not earned: **${num(impressions)}** impressions in the last 90 days, below the **top 5%** of ${cohort}, which starts at ${num(cuts?.topImpressionsMin ?? 0)}.`,
    active_platforms: `Not earned: distributed to **${num(platforms)} ${plural(platforms, 'platform')}**, below the **${MULTI_PLATFORM_MIN} platform** threshold.`,
    new_addition_trending:
      age > NEW_WINDOW_DAYS
        ? `Not earned: added **${num(age)} days ago**, outside the **${NEW_WINDOW_DAYS}-day** new window.`
        : `Not earned: added ${num(age)} days ago, but **${num(buyers)}** ${plural(buyers, 'buyer')} is below the **${MIN_BUYERS}-buyer** floor.`,
    dormant: impressions
      ? `Not earned, which is the good outcome here: **${num(impressions)}** impressions delivered in the last 90 days.`
      : `Not earned: it has delivered nothing, but was added **${num(age)} days ago** — inside the **${DORMANT_AFTER_DAYS}-day** window a new segment gets to pick up delivery.`,
  }

  return catalog.vocabulary.map((definition) => {
    const earned = segment.labels.includes(definition.key)
    return {
      label: definition.key,
      earned,
      explanation: earned
        ? (segment.labelReasons[definition.key] ??
          explainLabel(definition.key, row, t))
        : missed[definition.key],
    }
  })
}

export function buildPerformance(
  segment: Segment,
  row: SegmentFeatureRow,
  catalog: LiveCatalog,
): SegmentPerformance {
  // The score *is* the catalogue percentile: 100 for the most popular row.
  const topPct = Math.max(1, 101 - segment.marketplaceScore)
  const measuredOn = isoDate(row.cookie_reach_updated_at) ?? catalog.reachAsOf

  return {
    segmentId: segment.id,
    marketplaceScore: segment.marketplaceScore,
    scorePercentileNote: `Top ${topPct}% of the catalogue · reach rank ${row.reach_rank.toLocaleString('en-US')} · distribution rank ${row.distribution_rank.toLocaleString('en-US')}`,
    advertisersUsing90d: String(row.active_buyers),
    destinationCount: row.active_platforms,
    // The feed is a point-in-time snapshot of active distribution, not a time
    // series: there is no "weeks active" to count, no gaps to find, and nothing
    // to plot. Both views fall back to what the snapshot does report.
    usageIndex: [],
    destinations: segment.destinations,
    earnedLabels: earnedLabels(segment, row, catalog),
    evidence: {
      // Confidence in the footprint comes from how many independent buyers and
      // platforms corroborate it.
      attributionConfidence:
        row.active_buyers >= 5 && row.active_platforms >= MULTI_PLATFORM_MIN
          ? 'High'
          : row.active_buyers >= 2
            ? 'Medium'
            : 'Low',
      usageDirectlyAttributedPct: segment.advertiserDirectPctOfMedia,
      sharedAdGroupAllocationPct: 100 - segment.advertiserDirectPctOfMedia,
      labelsLastRecomputed: measuredOn,
      reportingWindowStart: measuredOn,
      reportingWindowEnd: measuredOn,
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
