import type {
  ChannelPerformance,
  PlatformPerformance,
  PlatformSegmentRow,
  SellerEvidence,
  SellerLabel,
  SellerSegment,
  SellerSegmentDetail,
} from '../types'

/** Splits "123Push > Consumer > Dry Eyes" into a greyed prefix and the rest. */
function splitPath(fullPath: string): { pathPrefix: string; name: string } {
  const i = fullPath.indexOf('>')
  if (i === -1) return { pathPrefix: '', name: fullPath }
  return {
    pathPrefix: fullPath.slice(0, i + 1),
    name: fullPath.slice(i + 1),
  }
}

type SeedSegment = Omit<SellerSegment, 'pathPrefix' | 'name'>

const SEED: SeedSegment[] = [
  {
    id: '1005020009',
    fullPath: '123Push > Consumer > Health and Wellness > Dry Eyes',
    segmentType: 'Syndicated',
    revenueRank: 1,
    revenue90d: 48210,
    buyersRequested: 34,
    buyersDistributing: 29,
    buyersWithRevenue: 26,
    labels: ['best_seller', 'top_campaign_spend', 'multi_platform', 'repeat_buyers'],
    destinations: ['Facebook', 'The Trade Desk', 'StackAdapt', 'Nativo', 'Mountain', 'Jun Group'],
    impressions90d: 612_000_000,
    growthPct: -5.0,
  },
  {
    id: '1009011121',
    fullPath: '123Push > Optimized for CTV > Consumer > Health and Wellness > Dry Eyes',
    segmentType: 'Syndicated',
    revenueRank: 2,
    revenue90d: 41880,
    buyersRequested: 28,
    buyersDistributing: 24,
    buyersWithRevenue: 21,
    labels: ['best_seller', 'most_impressions', 'multi_platform'],
    destinations: ['Facebook', 'StackAdapt', 'Mountain'],
    impressions90d: 548_000_000,
    growthPct: -5.0,
  },
  {
    id: '1005463569',
    fullPath: '123Push > Consumer > Purchase Based > Dog Food and Supplies',
    segmentType: 'Syndicated',
    revenueRank: 3,
    revenue90d: 33740,
    buyersRequested: 41,
    buyersDistributing: 33,
    buyersWithRevenue: 30,
    labels: ['best_seller', 'repeat_buyers', 'multi_platform', 'rising'],
    destinations: ['Facebook', 'Beeswax', 'StackAdapt', 'Amazon'],
    impressions90d: 497_000_000,
    growthPct: 31.8,
  },
  {
    id: '1009017651',
    fullPath:
      '123Push > Optimized for CTV > Purchase Intent > In Market Auto Intenders > Subaru Outback',
    segmentType: 'Syndicated',
    revenueRank: 4,
    revenue90d: 26550,
    buyersRequested: 19,
    buyersDistributing: 16,
    buyersWithRevenue: 14,
    labels: ['rising', 'top_campaign_spend'],
    destinations: ['Facebook', 'TikTok'],
    impressions90d: 288_000_000,
    growthPct: 50.6,
  },
  {
    id: '1009352151',
    fullPath: '123Push > Consumer > Lifestyle Triggers > New Pet Owners Of A Cat',
    segmentType: 'Syndicated',
    revenueRank: 5,
    revenue90d: 22190,
    buyersRequested: 26,
    buyersDistributing: 22,
    buyersWithRevenue: 18,
    labels: ['multi_platform', 'repeat_buyers'],
    destinations: ['Facebook', 'The Trade Desk', 'Yahoo!', 'StackAdapt', 'MadHive', 'Mountain'],
    impressions90d: 243_000_000,
    growthPct: -1.8,
  },
  {
    id: '1004905799',
    fullPath: '123Push > Consumer > Interest > Food and Drink > Recipes and Cooking',
    segmentType: 'Syndicated',
    revenueRank: 6,
    revenue90d: 18420,
    buyersRequested: 31,
    buyersDistributing: 24,
    buyersWithRevenue: 19,
    labels: ['rising', 'multi_platform'],
    destinations: ['Facebook', 'The Trade Desk', 'Spotify', 'Jun Group', 'StackAdapt'],
    impressions90d: 201_000_000,
    growthPct: 42.0,
  },
  {
    id: '1009134111',
    fullPath: '123Push > Instant Intent > CTV Streaming App > fuboTV Users',
    segmentType: 'Custom (Private)',
    revenueRank: 7,
    revenue90d: 12060,
    buyersRequested: 9,
    buyersDistributing: 7,
    buyersWithRevenue: 5,
    labels: ['single_buyer_concentration'],
    destinations: ['Facebook', 'Adobe Ad Cloud', 'Teads'],
    impressions90d: 96_000_000,
    growthPct: 0,
  },
  {
    id: '1004881201',
    fullPath: '123Push > Consumer > Demographic > Household Income > 100k to 150k',
    segmentType: 'Syndicated',
    revenueRank: 8,
    revenue90d: 9930,
    buyersRequested: 52,
    buyersDistributing: 38,
    buyersWithRevenue: 12,
    labels: ['requested_not_distributed'],
    destinations: ['The Trade Desk', 'StackAdapt'],
    impressions90d: 88_000_000,
    growthPct: 4.1,
  },
  {
    id: '1009024411',
    fullPath: '123Push > Optimized for CTV > Consumer > Auto > Truck Owners',
    segmentType: 'Syndicated',
    revenueRank: 9,
    revenue90d: 2140,
    buyersRequested: 14,
    buyersDistributing: 11,
    buyersWithRevenue: 2,
    labels: ['distributed_not_delivering'],
    destinations: ['Mountain'],
    impressions90d: 3_000_000,
    growthPct: -62.0,
  },
  {
    id: '1004770311',
    fullPath: '123Push > Consumer > Interest > Winter Sports > Snowboarding',
    segmentType: 'Syndicated',
    revenueRank: 10,
    revenue90d: 0,
    buyersRequested: 6,
    buyersDistributing: 4,
    buyersWithRevenue: 0,
    labels: ['dormant'],
    destinations: [],
    impressions90d: 0,
    growthPct: 0,
  },
  {
    id: '1009551021',
    fullPath: '123Push > Consumer > B2B > Firmographic > SMB Decision Makers',
    segmentType: 'Custom (Private)',
    revenueRank: 11,
    revenue90d: 7420,
    buyersRequested: 11,
    buyersDistributing: 9,
    buyersWithRevenue: 7,
    labels: [],
    destinations: ['LinkedIn', 'The Trade Desk'],
    impressions90d: 54_000_000,
    growthPct: 8.2,
  },
  {
    id: '1005441199',
    fullPath: '123Push > Consumer > Purchase Based > Baby and Toddler Products',
    segmentType: 'Syndicated',
    revenueRank: 12,
    revenue90d: 5110,
    buyersRequested: 17,
    buyersDistributing: 13,
    buyersWithRevenue: 9,
    labels: ['rising'],
    destinations: ['Facebook', 'Amazon', 'Simpli.fi'],
    impressions90d: 61_000_000,
    growthPct: 44.5,
  },
]

export const MOCK_SELLER_SEGMENTS: SellerSegment[] = SEED.map((s) => ({
  ...s,
  ...splitPath(s.fullPath),
}))

export const MOCK_CHANNELS: ChannelPerformance[] = [
  {
    channel: 'Programmatic',
    status: 'Strong',
    activeSegments: 10_153,
    trend: 'No Change Compared to Last Month',
    bestSellers: 18,
    needAttention: 14,
  },
  {
    channel: 'Social',
    status: 'Lagging',
    activeSegments: 294,
    trend: 'Slower Growth Compared to Last Month',
    bestSellers: 7,
    needAttention: 4,
  },
  {
    channel: 'TV',
    status: 'Lagging',
    activeSegments: 1_808,
    trend: 'Faster Growth Compared to Last Month',
    bestSellers: 5,
    needAttention: 11,
  },
]

export const MOCK_PLATFORMS: PlatformPerformance[] = [
  { id: 'amazon', name: 'Amazon', glyph: 'a', color: 'FF9900', status: 'Optimal', activeSegments: 113, revenueLastMonth: 41_200, growth: 'Faster Growth', bestSellers: 4, needAttention: 1 },
  { id: 'facebook', name: 'Facebook', glyph: 'f', color: '1877F2', status: 'Lagging', activeSegments: 265, revenueLastMonth: 96_700, growth: 'Slower Growth', bestSellers: 7, needAttention: 3 },
  { id: 'mountain', name: 'Mountain', glyph: 'M', color: '0F7B6C', status: 'Stalled', activeSegments: 1_437, revenueLastMonth: 28_400, growth: 'Slower Growth', bestSellers: 2, needAttention: 9 },
  { id: 'publica', name: 'Publica', glyph: 'P', color: '6B4EE6', status: 'Optimal', activeSegments: 95, revenueLastMonth: 19_800, growth: 'Faster Growth', bestSellers: 3, needAttention: 0 },
  { id: 'simplifi', name: 'Simpli.fi', glyph: 'S', color: 'E8562A', status: 'Optimal', activeSegments: 1_653, revenueLastMonth: 52_300, growth: 'Faster Growth', bestSellers: 5, needAttention: 4 },
  { id: 'spotify', name: 'Spotify', glyph: '♫', color: '1DB954', status: 'Optimal', activeSegments: 542, revenueLastMonth: 33_100, growth: 'Faster Growth', bestSellers: 3, needAttention: 1 },
  { id: 'stackadapt', name: 'StackAdapt', glyph: 's', color: '2B6CF6', status: 'Lagging', activeSegments: 3_568, revenueLastMonth: 74_900, growth: 'Slower Growth', bestSellers: 6, needAttention: 7 },
  { id: 'ttd', name: 'The Trade Desk', glyph: 'T', color: '0099E5', status: 'Stable', activeSegments: 7_128, revenueLastMonth: 118_500, growth: 'Slower Growth', bestSellers: 9, needAttention: 12 },
]

type SeedDrillRow = Omit<PlatformSegmentRow, 'pathPrefix' | 'name'>

const FACEBOOK_DRILL: SeedDrillRow[] = [
  { segmentId: '1005020009', fullPath: '123Push > Consumer > Health and Wellness > Dry Eyes', revenuePriorMonth: 4036, growthPct: -5.0, impressions: 118_000_000, destinations: 'Facebook, The Trade Desk, Jun Group, StackAdapt, Nativo, Mountain', labels: ['best_seller', 'top_campaign_spend', 'multi_platform', 'repeat_buyers'] },
  { segmentId: '1009011121', fullPath: '123Push > Optimized for CTV > Consumer > Health and Wellness > Dry Eyes', revenuePriorMonth: 4036, growthPct: -5.0, impressions: 104_000_000, destinations: 'Facebook, StackAdapt, Mountain', labels: ['best_seller', 'most_impressions', 'multi_platform'] },
  { segmentId: '1009134111', fullPath: '123Push > Instant Intent > CTV Streaming App > fuboTV Users', revenuePriorMonth: 1122, growthPct: null, impressions: 31_000_000, destinations: 'Facebook, Adobe Ad Cloud (formerly Tube Mogul), Teads', labels: ['single_buyer_concentration'] },
  { segmentId: '1009017651', fullPath: '123Push > Optimized for CTV > Purchase Intent > In Market Auto Intenders > Subaru Outback', revenuePriorMonth: 958, growthPct: 50.6, impressions: 26_000_000, destinations: 'Facebook, TikTok', labels: ['rising', 'top_campaign_spend'] },
  { segmentId: '1005463569', fullPath: '123Push > Consumer > Purchase Based > Dog Food and Supplies', revenuePriorMonth: 747, growthPct: 31.8, impressions: 22_000_000, destinations: 'Facebook, Beeswax, StackAdapt, Amazon', labels: ['best_seller', 'rising', 'repeat_buyers', 'multi_platform'] },
  { segmentId: '1009352151', fullPath: '123Push > Consumer > Lifestyle Triggers > New Pet Owners Of A Cat', revenuePriorMonth: 744, growthPct: -1.8, impressions: 19_000_000, destinations: 'Facebook, The Trade Desk, Yahoo!, StackAdapt, MadHive, Mountain', labels: ['multi_platform', 'repeat_buyers'] },
  { segmentId: '1004905799', fullPath: '123Push > Consumer > Interest > Food and Drink > Recipes and Cooking', revenuePriorMonth: 609, growthPct: 42.0, impressions: 17_000_000, destinations: 'Facebook, The Trade Desk, Spotify, Jun Group, StackAdapt', labels: ['rising', 'multi_platform'] },
  { segmentId: '1005441199', fullPath: '123Push > Consumer > Purchase Based > Baby and Toddler Products', revenuePriorMonth: 311, growthPct: 44.5, impressions: 9_000_000, destinations: 'Facebook, Amazon, Simpli.fi', labels: ['rising'] },
  { segmentId: '1009024411', fullPath: '123Push > Optimized for CTV > Consumer > Auto > Truck Owners', revenuePriorMonth: 0, growthPct: -100, impressions: 0, destinations: 'Facebook (distributed 74 days ago)', labels: ['distributed_not_delivering'] },
  { segmentId: '1004881201', fullPath: '123Push > Consumer > Demographic > Household Income > 100k to 150k', revenuePriorMonth: 0, growthPct: null, impressions: 0, destinations: 'Requested by 12 buyers on Facebook · none distributing', labels: ['requested_not_distributed'] },
]

const DRILL_ROWS: PlatformSegmentRow[] = FACEBOOK_DRILL.map((r) => ({
  ...r,
  ...splitPath(r.fullPath),
}))

/**
 * Every platform drills into the same fixture set for now; the live backend
 * returns destination-specific rows per platform.
 */
export function mockPlatformSegments(_platformId: string): PlatformSegmentRow[] {
  return DRILL_ROWS
}

export const MOCK_SELLER_EVIDENCE_WINDOW = {
  labelsLastRecomputed: '2026-08-15',
  reportingWindowStart: '2026-05-18',
  reportingWindowEnd: '2026-08-15',
}

function evidenceFor(segment: SellerSegment): SellerEvidence {
  const stalled =
    segment.labels.includes('distributed_not_delivering') ||
    segment.labels.includes('dormant')
  return {
    attributionConfidence: stalled ? null : 'High',
    usageDirectlyAttributed: segment.labels.includes('dormant')
      ? 'n/a'
      : '74% of impressions',
    ...MOCK_SELLER_EVIDENCE_WINDOW,
  }
}

const ACTIONS: Partial<Record<SellerLabel, string>> = {
  requested_not_distributed:
    '52 buyers requested this segment; 14 never set up distribution and 26 more are distributing without delivering. Check that the required pricing field is populated for their destinations, then ask your LiveRamp contact to follow up with the accounts.',
  distributed_not_delivering:
    'Distributed 74 days ago with no impressions. Most often a missing pricing field or an eligibility restriction at the destination.',
  dormant:
    'No revenue for 12 months. Consider repricing, renaming for discoverability, or retiring the listing before distribution is paused.',
  single_buyer_concentration:
    'One buyer drives most of this revenue. Worth diversifying before you reprice.',
}

export function mockSellerDetail(segment: SellerSegment): SellerSegmentDetail {
  const action = segment.labels.map((l) => ACTIONS[l]).find(Boolean)
  return {
    ...segment,
    evidence: evidenceFor(segment),
    ...(action ? { suggestedAction: action } : {}),
  }
}
