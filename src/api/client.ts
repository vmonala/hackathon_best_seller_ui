import { API_MODE, API_MODES, MOCKED_MODULES, apiModeFor } from './config'
import type { ApiModule } from './config'
import { liveApi } from './live'
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
  /**
   * `tagIds` narrows to the segments carrying the query's tags. It is resolved
   * against the Segment Intelligence API by the caller (`useSegments`) rather
   * than here, so neither adapter has to know about that second service.
   */
  listSegments(
    query: SegmentQuery,
    tagIds?: ReadonlySet<string> | null,
  ): Promise<Paginated<Segment>>
  getSegment(id: string): Promise<SegmentDetail>
  getFacets(): Promise<SegmentFacets>
  askDiscovery(question: string): Promise<AiDiscoveryResponse>

  /* Data Seller Insights — the seller-side view of the same usage data. */
  listSellerSegments(query: SellerSegmentQuery): Promise<Paginated<SellerSegment>>
  getSellerSegment(id: string): Promise<SellerSegmentDetail>
  getSellerSummary(): Promise<SellerInsightsSummary>
  getPlatforms(): Promise<PlatformPerformance[]>
  getPlatformSegments(platformId: string): Promise<PlatformSegmentRow[]>
}

/**
 * Single switch point between fixtures and the real backend, resolved one
 * module at a time. VITE_API_MODE sets the default; VITE_API_MODE_SEGMENTS,
 * VITE_API_MODE_DISCOVERY and VITE_API_MODE_SELLER override it per module, so
 * a slice the backend hasn't shipped yet can stay on fixtures.
 */
function pick<K extends keyof SegmentsApi>(
  key: K,
  module: ApiModule,
): SegmentsApi[K] {
  return apiModeFor(module) === 'live' ? liveApi[key] : mockApi[key]
}

export const api: SegmentsApi = {
  listSegments: pick('listSegments', 'segments'),
  getSegment: pick('getSegment', 'segments'),
  getFacets: pick('getFacets', 'segments'),
  askDiscovery: pick('askDiscovery', 'discovery'),
  listSellerSegments: pick('listSellerSegments', 'seller'),
  getSellerSegment: pick('getSellerSegment', 'seller'),
  getSellerSummary: pick('getSellerSummary', 'seller'),
  getPlatforms: pick('getPlatforms', 'seller'),
  getPlatformSegments: pick('getPlatformSegments', 'seller'),
}

export { API_MODE, API_MODES, MOCKED_MODULES, apiModeFor }
export type { ApiModule }
export * from './types'
