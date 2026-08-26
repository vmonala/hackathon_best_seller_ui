import { mockApi } from './mock'
import type {
  AiDiscoveryResponse,
  Paginated,
  PlatformPerformance,
  PlatformSegmentRow,
  Segment,
  SegmentDetail,
  SegmentFacets,
  SegmentQuery,
  SellerInsightsSummary,
  SellerSegment,
  SellerSegmentDetail,
  SellerSegmentQuery,
} from './types'

export interface SegmentsApi {
  listSegments(query: SegmentQuery): Promise<Paginated<Segment>>
  getSegment(id: string): Promise<SegmentDetail>
  getFacets(): Promise<SegmentFacets>
  askDiscovery(question: string): Promise<AiDiscoveryResponse>

  /* Data Seller Insights — the seller-side view of the same catalogue. */
  listSellerSegments(query: SellerSegmentQuery): Promise<Paginated<SellerSegment>>
  getSellerSegment(id: string): Promise<SellerSegmentDetail>
  getSellerSummary(): Promise<SellerInsightsSummary>
  getPlatforms(): Promise<PlatformPerformance[]>
  getPlatformSegments(platformId: string): Promise<PlatformSegmentRow[]>
}

/**
 * The app's data source.
 *
 * Everything is served from fixtures: the marketplace catalogue and its labels
 * come from a capture of the Segment Intelligence API (see
 * `mock/catalogRows.ts`), and the Data Seller Insights and AI discovery slices
 * are hand-authored, as they always were — that backend was never built.
 *
 * The interface above is deliberately unchanged from when a FastAPI adapter sat
 * behind it, so restoring one is a matter of writing a second implementation
 * and picking between them here.
 */
export const api: SegmentsApi = mockApi

export * from './types'
