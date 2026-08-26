/**
 * Domain types for the Marketplace Performance Labels UI.
 *
 * These are the contract between this app and the FastAPI backend.
 * Keep them in sync with the Pydantic response models — or, better,
 * regenerate them from the OpenAPI schema:
 *
 *   npx openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts
 */

export type PerformanceLabel =
  | 'top_performer'
  | 'frequently_reused'
  | 'trending_up'
  | 'proven_multi_platform'
  | 'new_gaining_traction'

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
  labels: PerformanceLabel[]
  platformCount: number
  /** Ordered by usage, strongest first */
  destinations: DestinationDelivery[]
  advertiserDirectPctOfMedia: number
  cpc: number
  cookieReach: number
  dateAdded: string
  category: string
  iabCategory?: string
}

export interface EarnedLabelExplanation {
  label: PerformanceLabel
  earned: boolean
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
  reportingWindowStart: string
  reportingWindowEnd: string
}

export interface SegmentPerformance {
  segmentId: string
  marketplaceScore: number
  scorePercentileNote: string
  advertisersUsing90d: string
  destinationCount: number
  weeksActive: number
  weeksInWindow: number
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
  count: number
}

export interface SegmentFacets {
  performanceLabels: FacetOption<PerformanceLabel>[]
  destinations: FacetOption<DestinationId>[]
  sellers: FacetOption[]
  statuses: FacetOption[]
}

export type SortKey =
  | 'marketplace_score'
  | 'cpc'
  | 'cookie_reach'
  | 'date_added'
  | 'name'

export interface SegmentQuery {
  search?: string
  labels?: PerformanceLabel[]
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
  labels: PerformanceLabel[]
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
