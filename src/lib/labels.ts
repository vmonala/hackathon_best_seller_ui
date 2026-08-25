import type { DestinationId, PerformanceLabel, UsageLevel } from '@/api/types'

export const LABEL_META: Record<
  PerformanceLabel,
  { text: string; short: string; icon: string; className: string }
> = {
  top_performer: {
    text: 'Top performer',
    short: 'Top performer',
    icon: '★',
    className: 'bdg-top',
  },
  frequently_reused: {
    text: 'Frequently reused',
    short: 'Reused',
    icon: '↻',
    className: 'bdg-reuse',
  },
  trending_up: {
    text: 'Trending up',
    short: 'Trending',
    icon: '▲',
    className: 'bdg-trend',
  },
  proven_multi_platform: {
    text: 'Proven multi-platform',
    short: 'Multi-platform',
    icon: '◈',
    className: 'bdg-multi',
  },
  new_gaining_traction: {
    text: 'New & gaining traction',
    short: 'New',
    icon: '✦',
    className: 'bdg-new',
  },
}

export const DESTINATION_META: Record<
  DestinationId,
  { name: string; glyph: string; className: string }
> = {
  facebook: { name: 'Facebook', glyph: 'f', className: 'bg-[#1877F2] text-white' },
  snapchat: { name: 'Snapchat', glyph: '◍', className: 'bg-black text-[#FFFC00]' },
  tiktok: { name: 'TikTok', glyph: '♪', className: 'bg-black text-white' },
  the_trade_desk: { name: 'The Trade Desk', glyph: 'T', className: 'bg-[#0F7B6C] text-white' },
  linkedin: { name: 'LinkedIn', glyph: 'in', className: 'bg-[#0A66C2] text-white' },
  pinterest: { name: 'Pinterest', glyph: 'P', className: 'bg-[#E60023] text-white' },
  x: { name: 'X', glyph: '𝕏', className: 'bg-black text-white' },
}

export const USAGE_TEXT: Record<UsageLevel, string> = {
  very_high: 'Very high usage',
  high: 'High usage',
  moderate: 'Moderate usage',
  low: 'Low usage',
}

export function scoreTone(score: number): 'high' | 'mid' | 'low' {
  if (score >= 80) return 'high'
  if (score >= 60) return 'mid'
  return 'low'
}

export function formatReach(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}
