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
