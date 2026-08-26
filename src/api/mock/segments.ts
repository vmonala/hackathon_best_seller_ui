import type { Segment, SegmentPerformance } from '../types'

function split(fullPath: string) {
  const idx = fullPath.lastIndexOf('>')
  return {
    pathPrefix: fullPath.slice(0, idx + 1).trim(),
    name: fullPath.slice(idx + 1).trim(),
  }
}

/**
 * Catalogue attributes the fixtures do not spell out per segment.
 *
 * The mockup shows a rate card, device-level reach and an input record count
 * alongside the delivered-usage numbers. Rather than hand-authoring eleven more
 * fields on twenty rows, they are derived from the two figures each fixture does
 * carry (`cpc` and `cookieReach`) at the ratios the design comps use, so the
 * columns stay internally consistent — a bigger cookie reach always implies a
 * bigger device reach and a bigger input file.
 */
const CPM_PER_CPC = 11.25
const CPM_CAP_MULTIPLE = 2.02
const IOS_PER_COOKIE = 2.55
const ANDROID_PER_COOKIE = 1.78
const INPUT_RECORDS_PER_COOKIE = 3.32

/** Measurement dates the whole fixture catalogue shares. */
const REACH_AS_OF = '2026-04-29'
const INPUT_RECORDS_AS_OF = '2026-08-20'
const LAST_REFRESHED = '2026-08-20'

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function seg(
  s: Omit<Segment, 'pathPrefix' | 'name'> & { fullPath: string },
): Segment {
  const { name, pathPrefix } = split(s.fullPath)
  const cpm = round2(s.cpc * CPM_PER_CPC)
  return {
    ...s,
    name,
    pathPrefix,
    description:
      s.description ??
      `${name} audience from ${s.seller}. Built from delivered marketplace ` +
        `signals across ${s.category.toLowerCase()}, and refreshed monthly for ` +
        `precision targeting on social, programmatic and CTV destinations.`,
    segmentType: s.segmentType ?? 'Standard',
    cpm: s.cpm ?? cpm,
    cpmCap: s.cpmCap ?? round2(cpm * CPM_CAP_MULTIPLE),
    // A few points above the advertiser-direct share: most media a marketplace
    // segment touches is bought programmatically.
    programmaticPctOfMedia:
      s.programmaticPctOfMedia ?? s.advertiserDirectPctOfMedia + 4,
    iosReach: s.iosReach ?? Math.round(s.cookieReach * IOS_PER_COOKIE),
    androidReach: s.androidReach ?? Math.round(s.cookieReach * ANDROID_PER_COOKIE),
    inputRecords:
      s.inputRecords ?? Math.round(s.cookieReach * INPUT_RECORDS_PER_COOKIE),
    // Provenance is not modelled in the fixtures; the drawer shows "-", which
    // is what the catalogue does for a seller that has not declared it.
    dataSourceMethod: s.dataSourceMethod,
    dataSourceDetail: s.dataSourceDetail,
    precisionLevel:
      s.precisionLevel ?? (Number(s.id) % 2 === 0 ? 'Household' : 'Individual'),
    dateLastRefreshed: s.dateLastRefreshed ?? LAST_REFRESHED,
    reachAsOf: s.reachAsOf ?? REACH_AS_OF,
    inputRecordsAsOf: s.inputRecordsAsOf ?? INPUT_RECORDS_AS_OF,
  }
}

export const MOCK_SEGMENTS: Segment[] = [
  seg({
    id: '4481902',
    fullPath:
      '!nsight > Retail > Consumer Electronics > Wearables > Smart Watch Buyers',
    seller: '!nsight',
    status: 'available',
    marketplaceScore: 94,
    labels: ['top_performer', 'frequently_reused', 'proven_multi_platform'],
    platformCount: 7,
    destinations: [
      { destination: 'facebook', channel: 'Advertiser Direct', usage: 'very_high', note: 'direct audience-level reporting', live: true },
      { destination: 'snapchat', channel: 'Advertiser Direct', usage: 'high', note: 'derived from ad squad targeting', live: true },
      { destination: 'tiktok', channel: 'Advertiser Direct', usage: 'high', note: 'direct audience-level reporting', live: true },
      { destination: 'the_trade_desk', usage: 'moderate', live: true },
      { destination: 'linkedin', usage: 'low', note: 'distributed', live: true },
      { destination: 'pinterest', usage: 'low', note: 'distributed', live: true },
      { destination: 'x', usage: 'low', note: 'distributed', live: true },
    ],
    advertiserDirectPctOfMedia: 14,
    cpc: 0.2,
    cookieReach: 11_700_000,
    dateAdded: '2026-04-27',
    category: 'Retail',
    iabCategory: 'IAB Shopping > Consumer Electronics',
  }),
  seg({
    id: '4481903',
    fullPath:
      'Alliant > Retail > Electronics > Wearable Tech > Smartwatch Intenders — In Market 30d',
    seller: 'Alliant',
    status: 'available',
    marketplaceScore: 91,
    labels: ['top_performer', 'trending_up'],
    platformCount: 4,
    destinations: [
      { destination: 'snapchat', channel: 'Advertiser Direct', usage: 'very_high', note: 'strongest destination', live: true },
      { destination: 'facebook', channel: 'Advertiser Direct', usage: 'high', live: true },
      { destination: 'tiktok', usage: 'moderate', live: true },
      { destination: 'the_trade_desk', usage: 'low', live: true },
    ],
    advertiserDirectPctOfMedia: 15,
    cpc: 0.26,
    cookieReach: 9_900_000,
    dateAdded: '2026-03-02',
    category: 'Retail',
    iabCategory: 'IAB Shopping > Consumer Electronics',
  }),
  seg({
    id: '4481904',
    fullPath:
      'Circana > Retail > Purchase Data > Consumer Tech > Smart Watch & Fitness Tracker Purchasers',
    seller: 'Circana',
    status: 'available',
    marketplaceScore: 88,
    labels: ['frequently_reused', 'proven_multi_platform'],
    platformCount: 5,
    destinations: [
      { destination: 'facebook', channel: 'Advertiser Direct', usage: 'high', live: true },
      { destination: 'snapchat', channel: 'Advertiser Direct', usage: 'high', live: true },
      { destination: 'linkedin', usage: 'moderate', live: true },
      { destination: 'tiktok', usage: 'low', live: true },
      { destination: 'the_trade_desk', usage: 'low', live: true },
    ],
    advertiserDirectPctOfMedia: 16,
    cpc: 0.28,
    cookieReach: 7_400_000,
    dateAdded: '2025-11-14',
    category: 'Retail',
  }),
  seg({
    id: '4481905',
    fullPath:
      'Experian > Retail > Consumer Technology > Wearables > Premium Smartwatch Owners (Apple / Garmin)',
    seller: 'Experian',
    status: 'available',
    marketplaceScore: 82,
    labels: ['frequently_reused'],
    platformCount: 3,
    destinations: [
      { destination: 'facebook', channel: 'Advertiser Direct', usage: 'very_high', note: 'proven destination', live: true },
      { destination: 'the_trade_desk', usage: 'moderate', live: true },
      { destination: 'snapchat', usage: 'low', live: true },
    ],
    advertiserDirectPctOfMedia: 15,
    cpc: 0.25,
    cookieReach: 6_100_000,
    dateAdded: '2026-01-08',
    category: 'Retail',
  }),
  seg({
    id: '4481906',
    fullPath:
      'Stirista > Retail > Electronics > Wearables > Smart Watch Shoppers — Android Households',
    seller: 'Stirista',
    status: 'available',
    marketplaceScore: 76,
    labels: ['new_gaining_traction'],
    platformCount: 2,
    destinations: [
      { destination: 'facebook', channel: 'Advertiser Direct', usage: 'high', note: 'proven destination', live: true },
      { destination: 'snapchat', usage: 'moderate', live: true },
    ],
    advertiserDirectPctOfMedia: 14,
    cpc: 0.22,
    cookieReach: 4_800_000,
    dateAdded: '2026-06-19',
    category: 'Retail',
  }),
  seg({
    id: '4481907',
    fullPath:
      'Adstra > Retail > Consumer Electronics > Wearables > Smartwatch Affinity — Fitness Enthusiasts',
    seller: 'Adstra',
    status: 'available',
    marketplaceScore: 61,
    labels: ['proven_multi_platform'],
    platformCount: 4,
    destinations: [
      { destination: 'facebook', usage: 'moderate', live: true },
      { destination: 'tiktok', usage: 'moderate', live: true },
      { destination: 'the_trade_desk', usage: 'low', live: true },
      { destination: 'linkedin', usage: 'low', live: true },
    ],
    advertiserDirectPctOfMedia: 15,
    cpc: 0.24,
    cookieReach: 5_500_000,
    dateAdded: '2025-08-30',
    category: 'Retail',
  }),
  seg({
    id: '4481908',
    fullPath:
      'Kantar > Retail > Media & Devices > Wearables > Smart Watch Category Interest',
    seller: 'Kantar',
    status: 'available',
    marketplaceScore: 48,
    labels: [],
    platformCount: 2,
    destinations: [
      { destination: 'the_trade_desk', usage: 'moderate', note: 'proven destination', live: true },
      { destination: 'facebook', usage: 'low', live: true },
    ],
    advertiserDirectPctOfMedia: 15,
    cpc: 0.25,
    cookieReach: 3_900_000,
    dateAdded: '2026-02-11',
    category: 'Retail',
  }),
  seg({
    id: '4481909',
    fullPath:
      'Dun & Bradstreet > Retail > Consumer Electronics > Wearables > Fitness Band Owners',
    seller: 'Dun & Bradstreet',
    status: 'requested',
    marketplaceScore: 55,
    labels: ['trending_up'],
    platformCount: 3,
    destinations: [
      { destination: 'tiktok', usage: 'high', live: true },
      { destination: 'snapchat', usage: 'moderate', live: true },
      { destination: 'facebook', usage: 'low', live: true },
    ],
    advertiserDirectPctOfMedia: 13,
    cpc: 0.19,
    cookieReach: 8_200_000,
    dateAdded: '2026-05-06',
    category: 'Retail',
  }),
  seg({
    id: '4481910',
    fullPath:
      'Oracle > Retail > Consumer Electronics > Wearables > Smartwatch Upgraders 12mo',
    seller: 'Oracle',
    status: 'approved',
    marketplaceScore: 72,
    labels: ['frequently_reused', 'proven_multi_platform'],
    platformCount: 5,
    destinations: [
      { destination: 'facebook', usage: 'high', live: true },
      { destination: 'the_trade_desk', usage: 'high', live: true },
      { destination: 'linkedin', usage: 'moderate', live: true },
      { destination: 'pinterest', usage: 'low', live: true },
      { destination: 'x', usage: 'low', live: true },
    ],
    advertiserDirectPctOfMedia: 17,
    cpc: 0.31,
    cookieReach: 10_400_000,
    dateAdded: '2025-09-22',
    category: 'Retail',
  }),
  seg({
    id: '4481911',
    fullPath:
      'LiveRamp Data Store > Retail > Electronics > Wearables > Smart Watch Gift Buyers — Q4',
    seller: 'LiveRamp Data Store',
    status: 'available',
    marketplaceScore: 67,
    labels: ['new_gaining_traction', 'trending_up'],
    platformCount: 3,
    destinations: [
      { destination: 'snapchat', usage: 'high', live: true },
      { destination: 'tiktok', usage: 'moderate', live: true },
      { destination: 'pinterest', usage: 'moderate', live: true },
    ],
    advertiserDirectPctOfMedia: 12,
    cpc: 0.18,
    cookieReach: 5_100_000,
    dateAdded: '2026-07-01',
    category: 'Retail',
  }),
  seg({
    id: '4481912',
    fullPath:
      'Acxiom > Retail > Consumer Electronics > Wearables > Health Tracking Device Households',
    seller: 'Acxiom',
    status: 'available',
    marketplaceScore: 84,
    labels: ['top_performer', 'proven_multi_platform'],
    platformCount: 6,
    destinations: [
      { destination: 'facebook', usage: 'very_high', live: true },
      { destination: 'the_trade_desk', usage: 'high', live: true },
      { destination: 'tiktok', usage: 'high', live: true },
      { destination: 'snapchat', usage: 'moderate', live: true },
      { destination: 'linkedin', usage: 'low', live: true },
      { destination: 'x', usage: 'low', live: true },
    ],
    advertiserDirectPctOfMedia: 18,
    cpc: 0.29,
    cookieReach: 13_200_000,
    dateAdded: '2025-12-03',
    category: 'Retail',
  }),
  seg({
    id: '4481913',
    fullPath:
      'Nielsen > Retail > Consumer Electronics > Wearables > Wearable Tech Early Adopters',
    seller: 'Nielsen',
    status: 'available',
    marketplaceScore: 39,
    labels: [],
    platformCount: 1,
    destinations: [{ destination: 'the_trade_desk', usage: 'low', live: true }],
    advertiserDirectPctOfMedia: 9,
    cpc: 0.15,
    cookieReach: 2_300_000,
    dateAdded: '2025-07-18',
    category: 'Retail',
  }),
]

/** Catalogue-level counters shown in the table footer. */
export const MOCK_CATALOG_TOTALS = {
  filteredTotal: 1_284,
  catalogTotal: 930_251,
}

const PERF_4481902: SegmentPerformance = {
  segmentId: '4481902',
  marketplaceScore: 94,
  scorePercentileNote: 'Top 5% in Retail · Wearables',
  advertisersUsing90d: '30+',
  destinationCount: 7,
  weeksActive: 13,
  weeksInWindow: 13,
  usageIndex: [
    { period: 'Mar', index: 44 },
    { period: 'Apr', index: 52 },
    { period: 'May', index: 49 },
    { period: 'Jun', index: 67 },
    { period: 'Jul', index: 84 },
    { period: 'Aug', index: 100 },
  ],
  destinations: [],
  earnedLabels: [
    {
      label: 'top_performer',
      earned: true,
      explanation:
        'In the **top 10%** of its category cohort for delivered impressions and licensing revenue over 90 days, with at least 5 distinct buyers.',
    },
    {
      label: 'frequently_reused',
      earned: true,
      explanation:
        '**≥60%** of buyers who licensed it in one month licensed it again the next.',
    },
    {
      label: 'proven_multi_platform',
      earned: true,
      explanation:
        'Delivered impressions on **≥3 destinations** in the window. Currently 7.',
    },
    {
      label: 'trending_up',
      earned: false,
      explanation:
        'Not earned: usage grew 11% versus the prior 90 days, below the **+40%** threshold.',
    },
  ],
  evidence: {
    attributionConfidence: 'High',
    usageDirectlyAttributedPct: 78,
    sharedAdGroupAllocationPct: 22,
    labelsLastRecomputed: '2026-08-15',
    reportingWindowStart: '2026-05-18',
    reportingWindowEnd: '2026-08-15',
  },
}

/**
 * Derives a plausible performance payload for any segment so every row in the
 * table opens a working detail page. 4481902 uses the hand-authored fixture.
 */
export function mockPerformanceFor(segment: Segment): SegmentPerformance {
  if (segment.id === '4481902') {
    return { ...PERF_4481902, destinations: segment.destinations }
  }

  const base = segment.marketplaceScore
  const weeks = Math.max(3, Math.round((base / 100) * 13))
  const curve = [0.46, 0.55, 0.52, 0.7, 0.86, 1]
  const trending = segment.labels.includes('trending_up')
  const usageIndex = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((period, i) => ({
    period,
    // Trending segments get the full ramp; everyone else gets a flatter curve
    // that still peaks recently, so a top performer never looks like it's dying.
    index: Math.round((trending ? curve[i] : curve[i] * 0.55 + 0.42) * 100),
  }))

  return {
    segmentId: segment.id,
    marketplaceScore: base,
    scorePercentileNote:
      base >= 85
        ? `Top 5% in ${segment.category} · Wearables`
        : base >= 70
          ? `Top 25% in ${segment.category} · Wearables`
          : `Mid cohort in ${segment.category} · Wearables`,
    advertisersUsing90d: base >= 85 ? '30+' : base >= 70 ? '15+' : base >= 55 ? '8+' : '<5',
    destinationCount: segment.platformCount,
    weeksActive: weeks,
    weeksInWindow: 13,
    usageIndex,
    destinations: segment.destinations,
    earnedLabels: (
      [
        'top_performer',
        'frequently_reused',
        'proven_multi_platform',
        'trending_up',
        'new_gaining_traction',
      ] as const
    ).map((label) => ({
      label,
      earned: segment.labels.includes(label),
      explanation: EARNED_COPY[label](segment),
    })),
    evidence: {
      attributionConfidence: base >= 80 ? 'High' : base >= 60 ? 'Medium' : 'Low',
      usageDirectlyAttributedPct: Math.min(92, Math.max(35, base - 12)),
      sharedAdGroupAllocationPct: 100 - Math.min(92, Math.max(35, base - 12)),
      labelsLastRecomputed: '2026-08-15',
      reportingWindowStart: '2026-05-18',
      reportingWindowEnd: '2026-08-15',
    },
  }
}

const EARNED_COPY: Record<string, (s: Segment) => string> = {
  top_performer: (s) =>
    s.labels.includes('top_performer')
      ? 'In the **top 10%** of its category cohort for delivered impressions and licensing revenue over 90 days, with at least 5 distinct buyers.'
      : 'Not earned: outside the **top 10%** of its category cohort for delivered impressions over the window.',
  frequently_reused: (s) =>
    s.labels.includes('frequently_reused')
      ? '**≥60%** of buyers who licensed it in one month licensed it again the next.'
      : 'Not earned: month-over-month repeat licensing is below the **60%** threshold.',
  proven_multi_platform: (s) =>
    s.labels.includes('proven_multi_platform')
      ? `Delivered impressions on **≥3 destinations** in the window. Currently ${s.platformCount}.`
      : `Not earned: delivered on ${s.platformCount} destination${s.platformCount === 1 ? '' : 's'}, below the **3 destination** threshold.`,
  trending_up: (s) =>
    s.labels.includes('trending_up')
      ? 'Usage grew more than **+40%** versus the prior 90 days.'
      : 'Not earned: usage growth is below the **+40%** threshold versus the prior 90 days.',
  new_gaining_traction: (s) =>
    s.labels.includes('new_gaining_traction')
      ? 'Added within the last **6 months** and already delivering on at least 2 destinations.'
      : 'Not earned: segment is older than the **6 month** new-segment window.',
}
