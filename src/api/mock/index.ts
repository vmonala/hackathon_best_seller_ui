import { MOCK_LATENCY_MS } from '../config'
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
  SellerSummaryTile,
} from '../types'
import { matchesLabelFilter } from '@/lib/sellerLabels'
import { runSegmentQuery } from '../segmentFilter'
import {
  MOCK_CHANNELS,
  MOCK_PLATFORMS,
  MOCK_SELLER_EVIDENCE_WINDOW,
  MOCK_SELLER_SEGMENTS,
  mockPlatformSegments,
  mockSellerDetail,
} from './seller'
import { MOCK_FACETS } from './facets'
import { mockDiscoveryAnswer } from './discovery'
import { buildSegmentDetail } from '../adapters/catalog'
import { CATALOG, MOCK_CATALOG_TOTALS, MOCK_SEGMENTS } from './segments'

const delay = (ms = MOCK_LATENCY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms))



const TILE_DEFS: Omit<SellerSummaryTile, 'count'>[] = [
  { key: 'best_seller', label: 'Best sellers', tone: 'default' },
  { key: 'top_campaign_spend', label: 'Top campaign spend', tone: 'default' },
  { key: 'multi_platform', label: 'Multi-platform', tone: 'default' },
  { key: 'rising', label: 'Rising', tone: 'default' },
  { key: 'needs_attention', label: 'Need attention', tone: 'warn' },
  { key: 'no_labels', label: 'No labels yet', tone: 'default' },
]

export function filterSellerSegments(query: SellerSegmentQuery): SellerSegment[] {
  const { search, label, sort = 'revenue_rank' } = query
  const q = (search ?? '').toLowerCase().trim()

  const rows = MOCK_SELLER_SEGMENTS.filter((s) => {
    if (q && !s.fullPath.toLowerCase().includes(q) && !s.id.includes(q)) return false
    return matchesLabelFilter(s.labels, label)
  })

  return [...rows].sort((a, b) => {
    switch (sort) {
      case 'revenue':
        return b.revenue90d - a.revenue90d
      case 'buyers_with_revenue':
        return b.buyersWithRevenue - a.buyersWithRevenue
      case 'revenue_rank':
      default:
        return a.revenueRank - b.revenueRank
    }
  })
}

export const mockApi = {
  async listSegments(query: SegmentQuery): Promise<Paginated<Segment>> {
    await delay()
    return {
      ...runSegmentQuery(MOCK_SEGMENTS, query),
      // The captured rows are one slice of a much larger marketplace — the
      // ranks on them run past 80,000 — so the footer totals quote the scale of
      // the catalogue those ranks were computed over, not the rows on hand.
      totalUnfiltered: MOCK_CATALOG_TOTALS.catalogTotal,
      totalBeforeLabelFilters: MOCK_CATALOG_TOTALS.filteredTotal,
    }
  },

  async getSegment(id: string): Promise<SegmentDetail> {
    await delay()
    const entry = CATALOG.byId.get(id)
    if (!entry) throw new Error(`Segment ${id} not found`)
    return buildSegmentDetail(entry, CATALOG)
  },

  async getFacets(): Promise<SegmentFacets> {
    await delay(120)
    return MOCK_FACETS
  },

  /**
   * A canned answer per topic. The routing and the copy live in
   * `./discovery` — each suggestion chip in the panel lands on a different
   * slice of the catalogue, ranked on a different angle.
   */
  async askDiscovery(question: string): Promise<AiDiscoveryResponse> {
    await delay(900)
    return mockDiscoveryAnswer(question)
  },

  async listSellerSegments(
    query: SellerSegmentQuery,
  ): Promise<Paginated<SellerSegment>> {
    await delay()
    const items = filterSellerSegments(query)
    return {
      items,
      total: items.length,
      totalUnfiltered: MOCK_SELLER_SEGMENTS.length,
      page: 1,
      pageSize: items.length,
    }
  },

  async getSellerSegment(id: string): Promise<SellerSegmentDetail> {
    await delay(150)
    const segment = MOCK_SELLER_SEGMENTS.find((s) => s.id === id)
    if (!segment) throw new Error(`Segment ${id} not found`)
    return mockSellerDetail(segment)
  },

  async getSellerSummary(): Promise<SellerInsightsSummary> {
    await delay(120)
    return {
      tiles: TILE_DEFS.map((t) => ({
        ...t,
        count: MOCK_SELLER_SEGMENTS.filter((s) =>
          matchesLabelFilter(s.labels, t.key),
        ).length,
      })),
      channels: MOCK_CHANNELS,
      labelsLastRecomputed: MOCK_SELLER_EVIDENCE_WINDOW.labelsLastRecomputed,
    }
  },

  async getPlatforms(): Promise<PlatformPerformance[]> {
    await delay(150)
    return MOCK_PLATFORMS
  },

  async getPlatformSegments(platformId: string): Promise<PlatformSegmentRow[]> {
    await delay(200)
    return mockPlatformSegments(platformId)
  },
}

export { MOCK_SEGMENTS, MOCK_FACETS, MOCK_CATALOG_TOTALS }
