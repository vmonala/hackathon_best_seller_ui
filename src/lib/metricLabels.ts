/**
 * What the list columns are called, and which of them have anything to show.
 *
 * The catalogue reports a segment's distribution footprint, its measured
 * Connect reach, its delivered impressions and the date it was added. It
 * reports no revenue, so the columns split cleanly in two — and a header must
 * never disagree with the number underneath it.
 */

export const METRIC_LABELS = {
  /** `Segment.cpc` — derived; see `synthesiseCatalogAttributes`. */
  cpc: 'CPC',
  cpcShort: 'CPC',
  /** `Segment.cookieReach` — measured Connect reach. */
  reach: 'Cookie Reach',
  /** Retained for callers that ask for the measured-reach wording explicitly. */
  reachMeasured: 'Cookie Reach',
  /** `Segment.advertiserDirectPctOfMedia` — derived. */
  pctMedia: 'Advertiser Direct % of Media',
  /** `Segment.impressions90d` — off the row; what the impressions label reads. */
  impressions: 'Impressions (90d)',
} as const

/**
 * Cookie, iOS and Android reach and the input record count are measured values
 * off the catalogue row, not derived — so they are never footnoted as
 * estimates and the columns are always available.
 */
export const REAL_REACH_METRICS = true

/**
 * The rate card (CPM, CPM cap), the CPC and the media-share percentages are
 * commercial attributes the catalogue does not report.
 *
 * Rather than leaving a third of the table empty, the adapter derives
 * illustrative stand-ins from each row's real reach and distribution — see
 * `synthesiseCatalogAttributes` in `src/api/adapters/catalog.ts`. They are
 * flagged as estimates in the column picker and under the table, and
 * `VITE_SYNTHETIC_CATALOG_METRICS=false` turns them off to show only what the
 * feed actually reports.
 */
export const SYNTHETIC_CATALOG_METRICS =
  import.meta.env.VITE_SYNTHETIC_CATALOG_METRICS !== 'false'

/** Whether those columns have anything at all to show. */
export const SHOW_CATALOG_METRICS = SYNTHETIC_CATALOG_METRICS

/** True when what they show is derived rather than reported. */
export const ESTIMATED_CATALOG_METRICS = SYNTHETIC_CATALOG_METRICS

/*
 * There is no sort picker on the list page. Sorting is driven entirely by
 * clicking a column header in `SegmentsTable`, which carries its own `sortKey`
 * per column; `src/api/segmentFilter.ts` still supports every `SortKey`,
 * including `marketplace_score`, which no header exposes.
 */
