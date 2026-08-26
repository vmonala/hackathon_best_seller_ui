import { apiModeFor, TAGS_REACH_ENABLED } from '@/api/config'
import type { SortKey } from '@/api/types'

/**
 * Three of the list columns carry a different metric in live mode, because the
 * backend reports delivered marketplace usage rather than catalogue reach or a
 * rate card. `src/api/adapters/catalog.ts` explains the substitutions; this is
 * the one place that decides what they are called on screen, so a header never
 * disagrees with the number underneath it.
 */
const LIVE_SEGMENTS = apiModeFor('segments') === 'live'

/**
 * Whether the app is *asking* the Segment Intelligence API for measured cookie,
 * iOS and Android reach and input record counts instead of deriving them from
 * delivered usage. See `TAGS_REACH_ENABLED` in `src/api/config.ts`.
 *
 * Asking is not getting: the row route that serves those figures is not
 * implemented yet, so with the flag on the request still 404s and the derived
 * values stand. Whether a header may call the column "Cookie Reach", and
 * whether the estimates footnote may drop it, therefore keys off
 * `Segment.reachMeasured` on the rows actually in hand — not off this flag.
 */
export const REAL_REACH_METRICS = TAGS_REACH_ENABLED

export const METRIC_LABELS = {
  /** `Segment.cpc` — effective CPM in live mode. */
  cpc: LIVE_SEGMENTS ? 'Effective CPM' : 'CPC',
  cpcShort: LIVE_SEGMENTS ? 'eCPM' : 'CPC',
  /** `Segment.cookieReach` — delivered impressions in live mode. */
  reach: LIVE_SEGMENTS ? 'Impressions Delivered' : 'Cookie Reach',
  /** What that column is once the tags API supplies measured reach instead. */
  reachMeasured: 'Cookie Reach',
  /** `Segment.advertiserDirectPctOfMedia` — share of buyers delivering in live mode. */
  pctMedia: LIVE_SEGMENTS ? 'Buyers Delivering' : 'Advertiser Direct % of Media',
} as const

/**
 * The rate card (CPM, CPM cap), the programmatic media share, the device-level
 * reach columns and the created date are catalogue attributes the usage feed
 * does not report.
 *
 * Rather than leaving half the table empty in live mode, the adapter derives
 * illustrative stand-ins from each row's real delivered usage — see
 * `synthesiseCatalogAttributes` in `src/api/adapters/catalog.ts`. They are
 * flagged as estimates in the column picker and under the table, and can be
 * turned off with `VITE_SYNTHETIC_CATALOG_METRICS=false` to see exactly what
 * the backend actually reports.
 */
export const SYNTHETIC_CATALOG_METRICS =
  LIVE_SEGMENTS && import.meta.env.VITE_SYNTHETIC_CATALOG_METRICS !== 'false'

/** Whether those columns have anything at all to show in this mode. */
export const SHOW_CATALOG_METRICS = !LIVE_SEGMENTS || SYNTHETIC_CATALOG_METRICS

/**
 * The catalog dump carries no creation date. In live mode the Date Added column
 * shows an estimate alongside the other synthesised catalogue attributes.
 */
export const SHOW_DATE_ADDED = !LIVE_SEGMENTS || SYNTHETIC_CATALOG_METRICS

/** True when what they show is derived rather than reported. */
export const ESTIMATED_CATALOG_METRICS = SYNTHETIC_CATALOG_METRICS

/**
 * Sorts offered on the list page. `marketplace_score` is deliberately absent:
 * the score is an internal percentile used to earn the performance labels, not
 * a number buyers rank by. `src/api/segmentFilter.ts` still supports the key.
 */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'cookie_reach', label: METRIC_LABELS.reach },
  { value: 'cpc', label: METRIC_LABELS.cpc },
  ...(SHOW_DATE_ADDED
    ? [{ value: 'date_added' as SortKey, label: 'Date added' }]
    : []),
  { value: 'name', label: 'Segment name' },
]
