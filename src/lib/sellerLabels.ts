import type { SellerLabel, SellerLabelFilter } from '@/api/types'

export interface SellerLabelMeta {
  text: string
  icon: string
  kind: 'demand' | 'attention'
  className: string
  /** Plain-English rule that earns the label, shown in the detail drawer. */
  criteria: string
}

export const SELLER_LABEL_META: Record<SellerLabel, SellerLabelMeta> = {
  best_seller: {
    text: 'Best seller',
    icon: '★',
    kind: 'demand',
    className: 'bdg-best',
    criteria:
      'Top 5% of its category cohort by Marketplace revenue over 90 days, with 5 or more buyers.',
  },
  top_campaign_spend: {
    text: 'Top campaign spend',
    icon: '$',
    kind: 'demand',
    className: 'bdg-spend',
    criteria:
      'Top 5% by media spend running against the segment — buyers are putting real budget behind it, not just testing it.',
  },
  most_impressions: {
    text: 'Most impressions',
    icon: '▮',
    kind: 'demand',
    className: 'bdg-imp',
    criteria:
      'Top 5% by delivered impressions in its cohort. High delivery relative to reach means the segment matches well at the destination.',
  },
  multi_platform: {
    text: 'Multi-platform',
    icon: '◈',
    kind: 'demand',
    className: 'bdg-multiplat',
    criteria: 'Delivered impressions on 3 or more destinations in the window.',
  },
  rising: {
    text: 'Rising',
    icon: '▲',
    kind: 'demand',
    className: 'bdg-rise',
    criteria:
      'Revenue up 40% or more versus the prior 90 days, above the minimum volume floor.',
  },
  repeat_buyers: {
    text: 'Repeat buyers',
    icon: '↻',
    kind: 'demand',
    className: 'bdg-rep',
    criteria:
      '60% or more of buyers active in one month were active again the next.',
  },
  dormant: {
    text: 'Dormant',
    icon: '!',
    kind: 'attention',
    className: 'bdg-warn',
    criteria:
      'No revenue on any destination for 12 months. Marketplace policy allows distribution to be paused at this point.',
  },
  distributed_not_delivering: {
    text: 'Distributed, not delivering',
    icon: '!',
    kind: 'attention',
    className: 'bdg-warn',
    criteria:
      'Live distribution with no impressions for 60 days. Usually a mapping, eligibility or pricing-field fault worth fixing.',
  },
  requested_not_distributed: {
    text: 'Requested, not distributed',
    icon: '!',
    kind: 'attention',
    className: 'bdg-warn',
    criteria:
      'Buyers requested the segment but never set up distribution. The most recoverable revenue in your catalogue.',
  },
  single_buyer_concentration: {
    text: 'Single-buyer concentration',
    icon: '◑',
    kind: 'attention',
    className: 'bdg-neutral',
    criteria:
      'One buyer accounts for more than 80% of revenue. Useful to know before you plan pricing.',
  },
}

/** The six demand labels, in the order they are shown in the drawer. */
export const DEMAND_LABELS: SellerLabel[] = [
  'best_seller',
  'top_campaign_spend',
  'most_impressions',
  'multi_platform',
  'rising',
  'repeat_buyers',
]

/** Label chips offered in the platform drill-down. */
export const DRILL_FILTER_KEYS: SellerLabelFilter[] = [
  ...DEMAND_LABELS,
  'needs_attention',
]

export const SELLER_FILTER_OPTIONS: { value: SellerLabelFilter | ''; label: string }[] = [
  { value: '', label: 'All labels' },
  ...DEMAND_LABELS.map((l) => ({
    value: l as SellerLabelFilter,
    label: SELLER_LABEL_META[l].text,
  })),
  { value: 'needs_attention', label: 'Needs attention' },
  { value: 'no_labels', label: 'No labels yet' },
]

export function isAttention(label: SellerLabel): boolean {
  return SELLER_LABEL_META[label].kind === 'attention'
}

export function matchesLabelFilter(
  labels: SellerLabel[],
  filter?: SellerLabelFilter | '',
): boolean {
  if (!filter) return true
  if (filter === 'needs_attention') return labels.some(isAttention)
  if (filter === 'no_labels') return labels.length === 0
  return labels.includes(filter)
}

export function filterLabel(filter: SellerLabelFilter): string {
  if (filter === 'needs_attention') return 'Needs attention'
  if (filter === 'no_labels') return 'No labels yet'
  return SELLER_LABEL_META[filter].text
}

export function formatUsd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

/** Compact money for platform tiles, e.g. $41.2K. */
export function formatUsdCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toLocaleString('en-US')}`
}

export function formatImpressions(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

export function formatGrowth(pct: number | null): string {
  if (pct === null) return '—'
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
}

export function growthClass(pct: number | null): string {
  if (pct === null || pct === 0) return 'text-muted2'
  return pct > 0 ? 'text-[#0A6B3C]' : 'text-[#B3261E]'
}

/** Tone for the status pill on channel and platform cards. */
export function statusTone(status: string): 'ok' | 'bad' | 'flat' {
  if (status === 'Lagging' || status === 'Stalled') return 'bad'
  if (status === 'Stable') return 'flat'
  return 'ok'
}
