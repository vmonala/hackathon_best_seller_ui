/**
 * Domain types for the Marketplace Performance Labels UI.
 *
 * These are the contract between this app and the FastAPI backend.
 * Keep them in sync with the Pydantic response models — or, better,
 * regenerate them from the OpenAPI schema:
 *
 *   npx openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts
 */

/**
 * Everything a marketplace segment can earn.
 *
 * One flat vocabulary — there is no longer a split between "performance
 * labels" and "intelligence tags". Each key is awarded from one rule, stated
 * in `LABEL_VOCABULARY` in `mock/catalogRows.ts`, and every award carries a
 * per-segment reason with that segment's own numbers in it (see
 * `Segment.labelReasons`).
 */
export type SegmentLabel =
  /** Top 5% of the catalogue by media spend running against the segment. */
  | 'top_campaign_spend'
  /** Top 5% of its category cohort by 90-day Marketplace revenue, 5+ buyers. */
  | 'best_seller'
  /** Top 5% of its category cohort by impressions delivered in the last 90 days. */
  | 'most_impressions'
  /** Distributed to four or more ad platforms. */
  | 'active_platforms'
  /** Added in the last 90 days, with 5 or more buyers already on it. */
  | 'new_addition_trending'
  /** Added more than 6 months ago and not running on any platform. */
  | 'dormant'

/** Destinations the UI ships hand-drawn styling for. */
export type KnownDestinationId =
  | 'facebook'
  | 'snapchat'
  | 'tiktok'
  | 'the_trade_desk'
  | 'linkedin'
  | 'pinterest'
  | 'x'

/**
 * The backend delivers on far more platforms than the seven above, and the
 * list grows without a UI release. So any platform slug is a valid
 * destination; the ones we know get bespoke styling, the rest are rendered
 * from a generated glyph and colour. See `src/lib/labels.ts`.
 */
export type DestinationId = KnownDestinationId | (string & {})

export type UsageLevel = 'very_high' | 'high' | 'moderate' | 'low'

export interface DestinationDelivery {
  destination: DestinationId
  /** e.g. "Advertiser Direct" */
  channel?: string
  usage: UsageLevel
  /** Human-readable provenance, e.g. "direct audience-level reporting" */
  note?: string
  live: boolean
}

/**
 * One entry in the label vocabulary: what a label is called and what has to be
 * true to earn it. This is the option list for the label filter.
 *
 * `description` is the criteria, phrased catalogue-wide. What the chip's
 * tooltip shows is the *segment's* reason from `Segment.labelReasons`, which
 * quotes that segment's own numbers; the criteria is the fallback when no
 * per-segment reason is available.
 */
export interface LabelDefinition {
  key: SegmentLabel
  /** e.g. "Best seller" */
  name: string
  /** e.g. "Top 5% of its category cohort by Marketplace revenue over 90 days" */
  description: string
  /** Picks the chip tone. See `SegmentLabelRow.category`. */
  category: string
  /** Lower sorts first; the table shows the strongest few. */
  priority: number
}

export interface Segment {
  id: string
  /** Full path, e.g. "!nsight > Retail > Consumer Electronics > Wearables > Smart Watch Buyers" */
  fullPath: string
  /** Everything before the final ">" */
  pathPrefix: string
  /** The leaf name shown in black */
  name: string
  seller: string
  status: 'available' | 'requested' | 'approved'
  marketplaceScore: number
  /** Earned labels, strongest first. */
  labels: SegmentLabel[]
  /**
   * Why *this* segment earned each of the labels above, with its own numbers in
   * it — "$9,400 of revenue; its cohort's top 5% starts at $4,120". Shown on the
   * chip tooltip and in the "How it earned its labels" breakdown. Keyed by
   * label; a label present in `labels` always has an entry.
   */
  labelReasons: Partial<Record<SegmentLabel, string>>
  platformCount: number
  /** Ordered by usage, strongest first */
  destinations: DestinationDelivery[]
  advertiserDirectPctOfMedia: number
  cpc: number
  cookieReach: number
  dateAdded: string
  category: string
  iabCategory?: string

  /* ---- Catalogue attributes ----
   * Everything below is catalogue metadata rather than delivered usage, so the
   * live `/v1/segments` feed carries only the first two. A column or drawer row
   * for an absent field renders as "-" rather than guessing a value.
   */

  /** Seller-authored copy, shown in the drawer's Configuration block. */
  description?: string
  /** e.g. "Standard", "Syndicated", "Custom (Private)" */
  segmentType?: string
  /** Rate card, per 1,000 impressions. */
  cpm?: number
  /** Ceiling the CPM is capped at for a single campaign. */
  cpmCap?: number
  /** Share of media the segment runs against programmatically. */
  programmaticPctOfMedia?: number
  iosReach?: number
  androidReach?: number
  /** Records the seller submitted, before identity resolution. */
  inputRecords?: number
  /** e.g. "Declared", "Modelled" */
  dataSourceMethod?: string
  dataSourceDetail?: string
  /** e.g. "Household", "Individual" */
  precisionLevel?: string
  /** ISO date of the last full refresh. */
  dateLastRefreshed?: string
  /** ISO date the device and cookie reach figures were measured. */
  reachAsOf?: string
  /** ISO date the input record count was measured. */
  inputRecordsAsOf?: string
  /** Impressions delivered in the last 90 days. `0` means nothing delivered. */
  impressions90d?: number
  /**
   * Impressions in the 90 days before that. `undefined` when the segment is
   * newer than the window and there is no comparable prior period.
   */
  impressionsPrior90d?: number
  /**
   * Change in impressions against that prior period, as a percentage.
   * `undefined` when there is no baseline to compare with.
   */
  impressionsGrowthPct?: number
  /**
   * True when the reach figures above are measured values from the Segment
   * Intelligence API rather than derived from delivered usage. Drives the
   * column header and the estimates footnote.
   */
  reachMeasured?: boolean
}

/**
 * One row of the "How it earned its labels" breakdown: every label in the
 * vocabulary, whether this segment earned it, and why — or why not.
 */
export interface EarnedLabelExplanation {
  label: SegmentLabel
  earned: boolean
  /** The segment's own numbers against the label's cut-off, either way. */
  explanation: string
}

export interface UsagePoint {
  /** e.g. "Mar" or "2026-03" */
  period: string
  /** 0-100, indexed to the segment's own peak */
  index: number
}

export interface EvidenceQuality {
  attributionConfidence: 'High' | 'Medium' | 'Low'
  usageDirectlyAttributedPct: number
  sharedAdGroupAllocationPct: number
  labelsLastRecomputed: string
  /**
   * The period the evidence covers. The catalogue is a point-in-time snapshot
   * rather than a window, so these are equal on marketplace segments and the UI
   * renders a single measurement date; the seller feed reports a real range.
   */
  reportingWindowStart: string
  reportingWindowEnd: string
}

export interface SegmentPerformance {
  segmentId: string
  marketplaceScore: number
  scorePercentileNote: string
  /** Distinct buyers with the segment enabled. */
  advertisersUsing90d: string
  destinationCount: number
  /**
   * Continuity of use. Both are absent for marketplace segments: the catalogue
   * reports a current distribution snapshot, with no week-by-week series to
   * count active weeks in. The KPI falls back to measured reach when they are.
   */
  weeksActive?: number
  weeksInWindow?: number
  /** Empty when no time series is reported; the sparkline is hidden. */
  usageIndex: UsagePoint[]
  destinations: DestinationDelivery[]
  earnedLabels: EarnedLabelExplanation[]
  evidence: EvidenceQuality
}

export interface SegmentDetail extends Segment {
  performance: SegmentPerformance
}

export interface FacetOption<T extends string = string> {
  value: T
  label: string
  /**
   * How many segments carry the value. Optional: the tag facet has no honest
   * count to show — the Segment Intelligence API counts tags over its own
   * ~198k-row catalog, not the ~14.6k the app renders — so it omits it and the
   * dropdown draws no number.
   */
  count?: number
  /** Hover text for the option. Used by the tag facet to carry the tag's reason. */
  hint?: string
}

export interface SegmentFacets {
  labels: FacetOption<SegmentLabel>[]
  destinations: FacetOption<DestinationId>[]
  sellers: FacetOption[]
  statuses: FacetOption[]
}

export type SortKey =
  /** Groups segments carrying the same labels together, strongest set first. */
  | 'labels'
  | 'marketplace_score'
  | 'cpc'
  | 'cookie_reach'
  | 'impressions'
  | 'date_added'
  | 'name'

export interface SegmentQuery {
  search?: string
  /**
   * Label keys, e.g. "best_seller". OR-ed: picking a second label widens the
   * results, which is what the independent per-label facet counts imply.
   */
  labels?: SegmentLabel[]
  destinations?: DestinationId[]
  sellers?: string[]
  statuses?: string[]
  sort?: SortKey
  direction?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  /** Size of the whole catalogue, for the "filtered from N" footer */
  totalUnfiltered: number
  /** Matches before performance-label and destination filters were applied */
  totalBeforeLabelFilters?: number
  page: number
  pageSize: number
}

/* ---------- AI Segment Discovery ---------- */

export interface AiRecommendation {
  rank: number
  segmentId: string
  fullPath: string
  marketplaceScore: number
  labels: SegmentLabel[]
  /** Why each of those labels was awarded. Empty when the answer omits them. */
  labelReasons?: Partial<Record<SegmentLabel, string>>
  platformCount: number
  extraBadge?: string
  meta: string[]
  why: string
}

export interface AiDiscoveryCitation {
  /** Origin label, e.g. "activation.md" or "BigQuery:best_sellers" */
  source: string
  text: string
  /** 0-1; SQL results use 1.0 */
  score: number
}

export interface AiDiscoveryResponse {
  id: string
  question: string
  lead: string
  recommendations: AiRecommendation[]
  note: string
  /** IDs of every segment considered, used to narrow the left-hand table */
  candidateSegmentIds: string[]
  totalCandidates: number
  /** SQL the agent executed, when it took the Text2SQL route */
  sqlUsed?: string
  /** Agent self-assessed confidence, 0-1 */
  confidence?: number
  /** Classified intent that drove the agent's routing */
  intent?: string
  /** Evidence fragments the answer cites */
  sources?: AiDiscoveryCitation[]
}

/* ---------- Data Seller Insights ---------- */

/**
 * Labels a seller's segment can earn from delivered Marketplace usage.
 * The six `demand` labels are the ones buyers see on a listing; the four
 * `attention` labels are private to the seller.
 */
export type SellerLabel =
  | 'best_seller'
  | 'top_campaign_spend'
  | 'most_impressions'
  | 'multi_platform'
  | 'rising'
  | 'repeat_buyers'
  | 'dormant'
  | 'distributed_not_delivering'
  | 'requested_not_distributed'
  | 'single_buyer_concentration'

/** Label filter, plus the two roll-ups the summary tiles filter by. */
export type SellerLabelFilter = SellerLabel | 'needs_attention' | 'no_labels'

export type SellerSortKey = 'revenue_rank' | 'revenue' | 'buyers_with_revenue'

export interface SellerSegment {
  /** DMS segment ID */
  id: string
  /** Full path, e.g. "123Push > Consumer > Health and Wellness > Dry Eyes" */
  fullPath: string
  /** Everything up to and including the first ">" — shown greyed */
  pathPrefix: string
  /** The remainder of the path, shown in black */
  name: string
  /** e.g. "Syndicated" or "Custom (Private)" */
  segmentType: string
  revenueRank: number
  revenue90d: number
  buyersRequested: number
  buyersDistributing: number
  buyersWithRevenue: number
  labels: SellerLabel[]
  /** Destinations the segment is live on, strongest first */
  destinations: string[]
  impressions90d: number
  /** Revenue change vs the prior 90 days; null when there is no baseline */
  growthPct: number | null
}

export interface SellerEvidence {
  /** null when there is no delivery to attribute */
  attributionConfidence: string | null
  usageDirectlyAttributed: string
  labelsLastRecomputed: string
  reportingWindowStart: string
  reportingWindowEnd: string
}

export interface SellerSegmentDetail extends SellerSegment {
  evidence: SellerEvidence
  /** Present only when the segment carries an attention label */
  suggestedAction?: string
}

export interface SellerSummaryTile {
  key: SellerLabelFilter
  label: string
  count: number
  tone: 'default' | 'warn'
}

export interface ChannelPerformance {
  channel: string
  status: 'Strong' | 'Lagging' | 'Stable'
  activeSegments: number
  /** e.g. "Slower Growth Compared to Last Month" */
  trend: string
  bestSellers: number
  needAttention: number
}

export interface SellerInsightsSummary {
  tiles: SellerSummaryTile[]
  channels: ChannelPerformance[]
  /** Window the labels were computed over, for the Overview hint line */
  labelsLastRecomputed: string
}

export interface PlatformPerformance {
  id: string
  name: string
  /** Single-character mark drawn in the platform tile */
  glyph: string
  /** Hex brand colour, without the leading "#" */
  color: string
  status: 'Optimal' | 'Lagging' | 'Stalled' | 'Stable'
  activeSegments: number
  revenueLastMonth: number
  /** e.g. "Faster Growth" */
  growth: string
  bestSellers: number
  needAttention: number
}

/** One row of a platform drill-down; metrics are destination-specific. */
export interface PlatformSegmentRow {
  segmentId: string
  fullPath: string
  pathPrefix: string
  name: string
  revenuePriorMonth: number
  growthPct: number | null
  impressions: number
  labels: SellerLabel[]
  /** Free-text destination context, e.g. "Facebook (distributed 74 days ago)" */
  destinations: string
}

export interface SellerSegmentQuery {
  search?: string
  label?: SellerLabelFilter
  sort?: SellerSortKey
}
