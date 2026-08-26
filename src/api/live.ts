import { apiFetch } from './http'
import { loadCatalog } from './liveCatalog'
import { buildSegmentDetail } from './adapters/catalog'
import { toDiscoveryResponse } from './adapters/discovery'
import { runSegmentQuery } from './segmentFilter'
import type { AgentAnswer } from './backend'
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
 * Marketplace segments + AI discovery are served by the Segment Intelligence
 * API, which exposes a single route with two behaviours:
 *
 *   GET /segments?page=&page_size=  -> CatalogPage  (browse the catalog dump)
 *   GET /segments?query=<question>  -> AgentAnswer  (Agentic RAG + Text2SQL)
 *
 * It has no filter, sort, detail or facets routes, so `listSegments`,
 * `getSegment` and `getFacets` all read from the once-fetched, cached catalog
 * in `liveCatalog.ts`. See `adapters/catalog.ts` for how the wire rows map onto
 * the `Segment` shape, and which UI fields the payload cannot support.
 *
 * Data Seller Insights is not built on this backend yet:
 *
 *   GET  /seller/segments                    -> Paginated[SellerSegment]
 *   GET  /seller/segments/{id}               -> SellerSegmentDetail
 *   GET  /seller/summary                     -> SellerInsightsSummary
 *   GET  /seller/platforms                   -> list[PlatformPerformance]
 *   GET  /seller/platforms/{id}/segments     -> list[PlatformSegmentRow]
 */
export const liveApi = {
  async listSegments(
    query: SegmentQuery,
    tagIds?: ReadonlySet<string> | null,
  ): Promise<Paginated<Segment>> {
    const catalog = await loadCatalog()
    return runSegmentQuery(catalog.segments, query, tagIds ?? null)
  },

  async getSegment(id: string): Promise<SegmentDetail> {
    const catalog = await loadCatalog()
    const entry = catalog.byId.get(id)
    if (!entry) throw new Error(`Segment ${id} is not in the marketplace catalog`)
    return buildSegmentDetail(entry, catalog)
  },

  async getFacets(): Promise<SegmentFacets> {
    const catalog = await loadCatalog()
    return catalog.facets
  },

  async askDiscovery(question: string): Promise<AiDiscoveryResponse> {
    // The agent answers in prose and cites SQL rows; the catalog is needed to
    // turn those rows back into segment cards.
    const [answer, catalog] = await Promise.all([
      apiFetch<AgentAnswer>('/segments', { params: { query: question } }),
      loadCatalog(),
    ])
    return toDiscoveryResponse(answer, catalog)
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
