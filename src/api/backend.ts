/**
 * Wire types for the LiveRamp Bestsellers Segment Intelligence API.
 *
 * Transcribed from http://localhost:8000/openapi.json — keep in sync with the
 * Pydantic models there. These are the *raw* shapes; everything the UI renders
 * goes through `adapters/catalog.ts` first.
 *
 * The API has exactly one route with two behaviours, discriminated by `mode`:
 *
 *   GET /v1/segments?page=&page_size=  -> CatalogPage   (mode: "catalog")
 *   GET /v1/segments?query=<question>  -> AgentAnswer   (mode: "agent")
 */

/** One row of the offline BigQuery dump of segment recommendation features. */
export interface SegmentFeatureRow {
  dms_segment_id: number
  /** Full taxonomy path, e.g. "Acxiom US Demographic > Age > 35-44" */
  segment_name: string
  segment_description: string | null
  segment_type: string
  seller_customer_id: number
  /** Platforms the segment is currently distributed to. */
  active_platform_names: string[]
  /** Platforms that delivered impressions in the usage window. */
  usage_platform_names: string[]
  active_destination_accounts: number
  active_buyers: number
  active_distribution_platforms: number
  buyers_with_usage: number
  platforms_with_usage: number
  impressions: number
  gross_data_revenue: number
  provider_net_revenue: number
  liveramp_net_revenue: number
  distribution_rank: number
  impressions_rank: number
  provider_revenue_rank: number
  buyer_usage_rank: number
  platform_usage_rank: number
  popularity_score: number
  popularity_rank: number
  is_highly_distributed: boolean
  is_highly_used: boolean
  is_top_n_popular: boolean
  usage_start_date: string
  usage_end_date: string
}

export interface PageInfo {
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface CatalogPage {
  mode: 'catalog'
  /** CSV file the rows were read from. */
  source: string
  pagination: PageInfo
  items: SegmentFeatureRow[]
}

export interface SourceCitation {
  /** e.g. "activation.md" or "BigQuery:best_sellers" */
  source: string
  text: string
  /** 0–1; SQL results use 1.0 */
  score: number
}

/** One BigQuery result row. */
export interface SqlRow {
  fields: Record<string, string | number | boolean | null>
}

export interface QueryResponse {
  /** Synthesised answer with inline "[Source: ...]" markers. */
  answer: string
  sources?: SourceCitation[]
  sql_used?: string | null
  confidence: number
  intent: 'analytics' | 'conceptual' | 'lookup' | 'mixed' | 'vague'
  sql_results?: SqlRow[]
}

export interface AgentAnswer {
  mode: 'agent'
  query: string
  result: QueryResponse
}

/* ---------- Segment Intelligence tags API (a second service) ---------- */

/**
 * Wire shapes for the tags backend — `VITE_TAGS_ORIGIN`, default
 * http://localhost:8001. Transcribed from its /openapi.json.
 *
 *   GET /v1/tags                  -> SegmentTagRow[]     (the whole vocabulary)
 *   GET /v1/segments/{id}/tags    -> SegmentTagRow[]     (one segment's tags)
 *   GET /v1/tags/{slug}/segments  -> TagSegmentsPage     (every segment with a tag)
 */
export interface SegmentTagRow {
  /** Stable slug, e.g. "top_facebook_activated". */
  tag_key: string
  display_name: string
  /** Why the tag was awarded, e.g. "Top 10% distributed on Facebook". */
  description: string
  /** "platform" | "reach" | "distribution" — treated as open-ended. */
  category: string
  /** Lower sorts first. Unique across the vocabulary. */
  priority: number
}

/** Paging envelope shared by the tags API's list routes. */
export interface TagsPageInfo {
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

/**
 * One page of `GET /v1/tags/{slug}/segments` — the reverse lookup that answers
 * "which segments carry this tag". `items` are raw `dms_segment_id` numbers,
 * nothing else, which is what makes bulk-loading a tag's whole set affordable.
 */
export interface TagSegmentsPage {
  tag_key: string
  pagination: TagsPageInfo
  items: number[]
}

/**
 * A catalog row from the tags API. Only the fields the UI would adopt are
 * transcribed; the row carries considerably more.
 *
 * Served today only inside the paged `GET /v1/segments` list — there is no
 * `GET /v1/segments/{id}`, which is why the reach enrichment that reads this is
 * behind `TAGS_REACH_ENABLED`.
 */
export interface SegmentIntelRow {
  dms_segment_id: number
  cookie_reach: number
  ios_reach: number
  android_reach: number
  input_records: number
  /** ISO timestamp, e.g. "2025-11-07T00:09:15". */
  cookie_reach_updated_at: string | null
  tags: SegmentTagRow[]
}
