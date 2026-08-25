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

export type DestinationId =
  | 'facebook'
  | 'snapchat'
  | 'tiktok'
  | 'the_trade_desk'
  | 'linkedin'
  | 'pinterest'
  | 'x'

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

export interface AiDiscoveryResponse {
  id: string
  question: string
  lead: string
  recommendations: AiRecommendation[]
  note: string
  /** IDs of every segment considered, used to narrow the left-hand table */
  candidateSegmentIds: string[]
  totalCandidates: number
}
