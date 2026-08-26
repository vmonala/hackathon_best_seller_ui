/**
 * Wire types for the LiveRamp Bestsellers Segment Intelligence API.
 *
 * The app no longer calls that API. The catalogue it served was captured into
 * `src/api/mock/catalogRows.ts` and is read from there — see `src/api/client.ts`.
 * These types stay because they describe the shape of that capture, so the
 * fixture and the adapter that reads it cannot drift apart, and so re-pointing
 * the app at a live backend later is a matter of restoring a fetch layer rather
 * than re-deriving the contract.
 *
 * Transcribed from the `/openapi.json` of both services as of 2026-08-26:
 *
 *   GET :8000/v1/segments   -> CatalogPage        (the catalogue rows)
 *   GET :8001/v1/labels     -> SegmentLabelRow[]  (the label vocabulary)
 *   GET :8001/v1/segments   -> the same rows, each with its labels inlined
 */

/**
 * One catalogue row: a segment's distribution footprint and its measured
 * device reach.
 *
 * Note what is *not* here. An earlier revision of this API reported gross data
 * revenue and per-buyer spend. That feed is gone, and with it every
 * revenue-derived figure. `adapters/catalog.ts` documents what the UI does
 * about the columns that used to read from it.
 *
 * The delivered-usage, commercial and lifecycle fields below *are* on the row,
 * but they are generated for the fixture rather than captured — see the module
 * docblock in `mock/catalogRows.ts`.
 */
export interface SegmentFeatureRow {
  dms_segment_id: number
  /** Full taxonomy path, e.g. "Acxiom US Demographic > Age > 35-44" */
  segment_name: string
  segment_description: string | null
  segment_type: string
  seller_customer_id: number

  /* ---- Distribution footprint ---- */
  /** Distinct destination accounts the segment is enabled on. */
  active_destination_accounts: number
  /** Distinct buying customers across those accounts. */
  active_buyers: number
  /** Distinct ad platforms, i.e. `active_platform_names.length`. */
  active_platforms: number
  active_platform_names: string[]

  /* ---- Connect estimated reach ---- */
  cookie_reach: number
  ios_reach: number
  android_reach: number
  /** Largest reach across every ad network account, cookie included. */
  max_connect_reach: number
  /** Records the seller submitted, before identity resolution. */
  input_records: number
  /** Estimated reach per platform, keyed by the names in `active_platform_names`. */
  reach_by_platform: Record<string, number>
  /** ISO timestamps, e.g. "2026-01-10T01:15:44Z". */
  cookie_reach_updated_at: string | null
  ios_reach_updated_at: string | null
  android_reach_updated_at: string | null

  /* ---- Delivered usage and lifecycle ---- */
  /** Impressions delivered against the segment in the last 90 days. */
  impressions_90d: number
  /**
   * Impressions in the 90 days before that, for the growth comparison. `0`
   * means there is no comparable prior period — the segment is newer than the
   * window — not that nothing delivered.
   */
  impressions_prior_90d: number
  /** Buy-side media spend running against the segment in the last 90 days, USD. */
  media_spend_90d: number
  /** Marketplace revenue the segment earned in the last 90 days, USD. */
  marketplace_revenue_90d: number
  /** ISO date the segment was added to the marketplace, e.g. "2026-06-27". */
  added_at: string

  /* ---- Catalogue-wide ranks and flags ---- */
  /** 1 = most widely distributed. Ranked over the API's full catalogue. */
  distribution_rank: number
  /** 1 = largest cookie reach. Ranked over the API's full catalogue. */
  reach_rank: number
  is_highly_distributed: boolean
  is_highly_reachable: boolean
  is_top_n_by_reach: boolean

  /**
   * The labels awarded to this row, by key, resolved against
   * `LABEL_VOCABULARY`.
   *
   * The intel API inlined the whole label object on every row; the fixture
   * stores keys instead so a label's wording lives in exactly one place. See
   * `mock/catalogRows.ts` for how they are derived.
   */
  label_keys: string[]
}

/** One entry in the label vocabulary. */
export interface SegmentLabelRow {
  /** Stable slug, e.g. "best_seller". */
  label_key: string
  display_name: string
  /**
   * The *criteria* — what has to be true to earn it, e.g. "Top 5% of its
   * category cohort by Marketplace revenue". The per-segment reason, quoting that
   * segment's own numbers, is built by `explainLabel` in
   * `adapters/catalog.ts`.
   */
  description: string
  /**
   * "performance" | "demand" | "distribution" | "lifecycle" | "attention" —
   * treated as open-ended; it picks the chip tone.
   */
  category: string
  /** Lower sorts first. Unique across the vocabulary. */
  priority: number
}
