import { MOCK_LATENCY_MS } from '../config'
import type {
  AiDiscoveryResponse,
  Paginated,
  Segment,
  SegmentDetail,
  SegmentFacets,
  SegmentQuery,
} from '../types'
import { MOCK_FACETS } from './facets'
import {
  MOCK_CATALOG_TOTALS,
  MOCK_SEGMENTS,
  mockPerformanceFor,
} from './segments'

const delay = (ms = MOCK_LATENCY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms))

function matchesSearch(segment: Segment, search?: string) {
  if (!search) return true
  const q = search.toLowerCase().trim()
  if (!q) return true
  return (
    segment.fullPath.toLowerCase().includes(q) ||
    segment.seller.toLowerCase().includes(q) ||
    // Loose token match so "smart watch" also hits "Smartwatch".
    segment.fullPath.toLowerCase().replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
  )
}

export function filterSegments(query: SegmentQuery): Segment[] {
  const {
    search,
    labels = [],
    destinations = [],
    sellers = [],
    statuses = [],
    sort = 'marketplace_score',
    direction = 'desc',
  } = query

  const rows = MOCK_SEGMENTS.filter((s) => {
    if (!matchesSearch(s, search)) return false
    // Performance labels are OR-ed: selecting two labels widens the result set,
    // which is what the independent per-label facet counts imply.
    if (labels.length && !labels.some((l) => s.labels.includes(l))) return false
    // Destinations are AND-ed: "proven on Facebook AND Snapchat" is the
    // activation question buyers are actually asking.
    if (
      destinations.length &&
      !destinations.every((d) =>
        s.destinations.some((sd) => sd.destination === d && sd.live),
      )
    )
      return false
    if (sellers.length && !sellers.includes(s.seller)) return false
    if (statuses.length && !statuses.includes(s.status)) return false
    return true
  })

  const dir = direction === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    switch (sort) {
      case 'cpc':
        return (a.cpc - b.cpc) * dir
      case 'cookie_reach':
        return (a.cookieReach - b.cookieReach) * dir
      case 'date_added':
        return (Date.parse(a.dateAdded) - Date.parse(b.dateAdded)) * dir
      case 'name':
        return a.name.localeCompare(b.name) * dir
      case 'marketplace_score':
      default:
        return (a.marketplaceScore - b.marketplaceScore) * dir
    }
  })

  return rows
}

export const mockApi = {
  async listSegments(query: SegmentQuery): Promise<Paginated<Segment>> {
    await delay()
    const all = filterSegments(query)
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 25
    const start = (page - 1) * pageSize
    return {
      items: all.slice(start, start + pageSize),
      total: all.length,
      totalUnfiltered: MOCK_CATALOG_TOTALS.catalogTotal,
      totalBeforeLabelFilters: MOCK_CATALOG_TOTALS.filteredTotal,
      page,
      pageSize,
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
}

export { MOCK_SEGMENTS, MOCK_FACETS, MOCK_CATALOG_TOTALS }
