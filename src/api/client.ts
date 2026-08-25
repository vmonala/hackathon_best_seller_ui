import { API_MODE } from './config'
import { liveApi } from './live'
import { mockApi } from './mock'
import type {
  AiDiscoveryResponse,
  Paginated,
  Segment,
  SegmentDetail,
  SegmentFacets,
  SegmentQuery,
} from './types'

export interface SegmentsApi {
  listSegments(query: SegmentQuery): Promise<Paginated<Segment>>
  getSegment(id: string): Promise<SegmentDetail>
  getFacets(): Promise<SegmentFacets>
  askDiscovery(question: string): Promise<AiDiscoveryResponse>
}

/**
 * Single switch point between fixtures and the real backend.
 * Set VITE_API_MODE=live in .env to hit FastAPI.
 */
export const api: SegmentsApi = API_MODE === 'live' ? liveApi : mockApi

export { API_MODE }
export * from './types'
