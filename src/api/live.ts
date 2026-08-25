import { apiFetch } from './http'
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

/**
 * FastAPI client. Endpoint paths and param names below are the contract this
 * UI expects — adjust here (and only here) if your routes differ.
 *
 *   GET  /segments            -> Paginated[Segment]
 *   GET  /segments/{id}       -> SegmentDetail
 *   GET  /segments/facets     -> SegmentFacets
 *   POST /discovery/ask       -> AiDiscoveryResponse
 *
 *   GET  /seller/segments                    -> Paginated[SellerSegment]
 *   GET  /seller/segments/{id}               -> SellerSegmentDetail
 *   GET  /seller/summary                     -> SellerInsightsSummary
 *   GET  /seller/platforms                   -> list[PlatformPerformance]
 *   GET  /seller/platforms/{id}/segments     -> list[PlatformSegmentRow]
 */
export const liveApi = {
  listSegments(query: SegmentQuery): Promise<Paginated<Segment>> {
    return apiFetch<Paginated<Segment>>('/segments', {
      params: {
        search: query.search,
        // Repeated keys map to FastAPI Query(List[str]) params.
        labels: query.labels,
        destinations: query.destinations,
        sellers: query.sellers,
        statuses: query.statuses,
        sort: query.sort,
        direction: query.direction,
        page: query.page,
        page_size: query.pageSize,
      },
    })
  },

  getSegment(id: string): Promise<SegmentDetail> {
    return apiFetch<SegmentDetail>(`/segments/${encodeURIComponent(id)}`)
  },

  getFacets(): Promise<SegmentFacets> {
    return apiFetch<SegmentFacets>('/segments/facets')
  },

  askDiscovery(question: string): Promise<AiDiscoveryResponse> {
    return apiFetch<AiDiscoveryResponse>('/discovery/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    })
  },

  listSellerSegments(query: SellerSegmentQuery): Promise<Paginated<SellerSegment>> {
    return apiFetch<Paginated<SellerSegment>>('/seller/segments', {
      params: {
        search: query.search,
        label: query.label,
        sort: query.sort,
      },
    })
  },

  getSellerSegment(id: string): Promise<SellerSegmentDetail> {
    return apiFetch<SellerSegmentDetail>(`/seller/segments/${encodeURIComponent(id)}`)
  },

  getSellerSummary(): Promise<SellerInsightsSummary> {
    return apiFetch<SellerInsightsSummary>('/seller/summary')
  },

  getPlatforms(): Promise<PlatformPerformance[]> {
    return apiFetch<PlatformPerformance[]>('/seller/platforms')
  },

  getPlatformSegments(platformId: string): Promise<PlatformSegmentRow[]> {
    return apiFetch<PlatformSegmentRow[]>(
      `/seller/platforms/${encodeURIComponent(platformId)}/segments`,
    )
  },
}
