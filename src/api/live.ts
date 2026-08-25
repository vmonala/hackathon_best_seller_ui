import { apiFetch } from './http'
import type {
  AiDiscoveryResponse,
  Paginated,
  Segment,
  SegmentDetail,
  SegmentFacets,
  SegmentQuery,
} from './types'

/**
 * FastAPI client. Endpoint paths and param names below are the contract this
 * UI expects — adjust here (and only here) if your routes differ.
 *
 *   GET  /segments            -> Paginated[Segment]
 *   GET  /segments/{id}       -> SegmentDetail
 *   GET  /segments/facets     -> SegmentFacets
 *   POST /discovery/ask       -> AiDiscoveryResponse
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
}
