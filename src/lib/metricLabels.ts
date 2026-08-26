import { apiModeFor } from '@/api/config'
import type { SortKey } from '@/api/types'

/**
 * Three of the list columns carry a different metric in live mode, because the
 * backend reports delivered marketplace usage rather than catalogue reach or a
 * rate card. `src/api/adapters/catalog.ts` explains the substitutions; this is
 * the one place that decides what they are called on screen, so a header never
 * disagrees with the number underneath it.
 */
const LIVE_SEGMENTS = apiModeFor('segments') === 'live'

export const METRIC_LABELS = {
  /** `Segment.cpc` — effective CPM in live mode. */
  cpc: LIVE_SEGMENTS ? 'Effective CPM' : 'CPC',
  cpcShort: LIVE_SEGMENTS ? 'eCPM' : 'CPC',
  /** `Segment.cookieReach` — delivered impressions in live mode. */
  reach: LIVE_SEGMENTS ? 'Impressions Delivered' : 'Cookie Reach',
  /** `Segment.advertiserDirectPctOfMedia` — share of buyers delivering in live mode. */
  pctMedia: LIVE_SEGMENTS ? 'Buyers Delivering' : 'Advertiser Direct % of Media',
} as const

/** The catalog dump carries no creation date, so there is nothing to show. */
export const SHOW_DATE_ADDED = !LIVE_SEGMENTS

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'marketplace_score', label: 'Marketplace performance' },
  { value: 'cpc', label: METRIC_LABELS.cpc },
  { value: 'cookie_reach', label: METRIC_LABELS.reach },
  ...(SHOW_DATE_ADDED
    ? [{ value: 'date_added' as SortKey, label: 'Date added' }]
    : []),
  { value: 'name', label: 'Segment name' },
]
