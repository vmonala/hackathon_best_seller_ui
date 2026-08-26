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
import {
  MOCK_CATALOG_TOTALS,
  MOCK_SEGMENTS,
  mockPerformanceFor,
} from './segments'

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
  async listSegments(
    query: SegmentQuery,
    tagIds?: ReadonlySet<string> | null,
  ): Promise<Paginated<Segment>> {
    await delay()
    return {
      // Tags come from a live-only service, so `tagIds` is null under fixtures
      // and the tag filter is not offered — it is honoured here regardless so
      // the two adapters stay interchangeable.
      ...runSegmentQuery(MOCK_SEGMENTS, query, tagIds ?? null),
      // The fixtures stand in for a much larger catalogue, so the footer
      // totals come from the scenario rather than from the 12 rows on hand.
      totalUnfiltered: MOCK_CATALOG_TOTALS.catalogTotal,
      totalBeforeLabelFilters: MOCK_CATALOG_TOTALS.filteredTotal,
    }
  },

  async getSegment(id: string): Promise<SegmentDetail> {
    await delay()
    const segment = MOCK_SEGMENTS.find((s) => s.id === id)
    if (!segment) throw new Error(`Segment ${id} not found`)
    return { ...segment, performance: mockPerformanceFor(segment) }
  },

  async getFacets(): Promise<SegmentFacets> {
    await delay(120)
    return MOCK_FACETS
  },

  async askDiscovery(question: string): Promise<AiDiscoveryResponse> {
    await delay(900)
    const top = MOCK_SEGMENTS.filter((s) =>
      ['4481902', '4481903', '4481904'].includes(s.id),
    ).sort((a, b) => b.marketplaceScore - a.marketplaceScore)

    const why: Record<string, string> = {
      '4481902':
        'Top 5% of retail segments by delivered impressions on Facebook and Snapchat; used in every one of the last 13 weeks; most buyers who ran it once ran it again.',
      '4481903':
        'Usage on Snapchat has roughly doubled versus the previous 90 days — the fastest-rising smartwatch segment on that platform.',
      '4481904':
        'Purchase-based rather than intent-based, and the most repeatedly licensed wearables segment in the category.',
    }
    const extra: Record<string, string | undefined> = {
      '4481903': 'Strongest on Snapchat',
    }

    return {
      id: crypto.randomUUID(),
      question,
      lead: 'Here are the three most-used retail wearables segments that are **already delivering on both Facebook and Snapchat**, ranked by activity over the last 90 days rather than by catalogue reach alone.',
      recommendations: top.map((s, i) => ({
        rank: i + 1,
        segmentId: s.id,
        fullPath: s.fullPath,
        marketplaceScore: s.marketplaceScore,
        labels: s.labels,
        platformCount: s.platformCount,
        extraBadge: extra[s.id],
        meta: [
          'Facebook **live**',
          'Snapchat **live**',
          `${s.advertiserDirectPctOfMedia}% of media`,
          `${(s.cookieReach / 1_000_000).toFixed(1)}M cookie reach`,
        ],
        why: why[s.id] ?? '',
      })),
      note: '**Why these three?** 26 retail smartwatch segments are distributable to Facebook and Snapchat. I ranked them on delivered usage, repeat licensing and continuity — not on price or reach. Labels reflect aggregate marketplace activity, not campaign outcomes for your KPIs.',
      candidateSegmentIds: top.map((s) => s.id),
      totalCandidates: 26,
    }
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
