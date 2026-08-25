import type { SegmentFacets } from '../types'

/**
 * Facet counts are catalogue-wide in the real product (computed by the backend),
 * so they are intentionally NOT derived from the 12 mock rows.
 */
export const MOCK_FACETS: SegmentFacets = {
  performanceLabels: [
    { value: 'top_performer', label: 'Top performer', count: 412 },
    { value: 'frequently_reused', label: 'Frequently reused', count: 688 },
    { value: 'trending_up', label: 'Trending up', count: 203 },
    { value: 'proven_multi_platform', label: 'Proven multi-platform', count: 1140 },
    { value: 'new_gaining_traction', label: 'New & gaining traction', count: 96 },
  ],
  destinations: [
    { value: 'facebook', label: 'Facebook', count: 2318 },
    { value: 'snapchat', label: 'Snapchat', count: 1042 },
    { value: 'tiktok', label: 'TikTok', count: 1655 },
    { value: 'the_trade_desk', label: 'The Trade Desk', count: 4907 },
    { value: 'linkedin', label: 'LinkedIn', count: 781 },
  ],
  sellers: [
    { value: '!nsight', label: '!nsight', count: 1_204 },
    { value: 'Alliant', label: 'Alliant', count: 3_918 },
    { value: 'Circana', label: 'Circana', count: 2_441 },
    { value: 'Experian', label: 'Experian', count: 8_770 },
    { value: 'Stirista', label: 'Stirista', count: 1_662 },
    { value: 'Adstra', label: 'Adstra', count: 2_015 },
    { value: 'Kantar', label: 'Kantar', count: 903 },
    { value: 'Dun & Bradstreet', label: 'Dun & Bradstreet', count: 1_337 },
    { value: 'Oracle', label: 'Oracle', count: 5_204 },
    { value: 'LiveRamp Data Store', label: 'LiveRamp Data Store', count: 742 },
    { value: 'Acxiom', label: 'Acxiom', count: 6_611 },
    { value: 'Nielsen', label: 'Nielsen', count: 1_988 },
  ],
  statuses: [
    { value: 'available', label: 'Available', count: 921_004 },
    { value: 'requested', label: 'Requested', count: 6_812 },
    { value: 'approved', label: 'Approved', count: 2_435 },
  ],
}
