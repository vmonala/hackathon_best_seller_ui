import type {
  DestinationId,
  KnownDestinationId,
  PerformanceLabel,
  UsageLevel,
} from '@/api/types'
import { BRAND_LOGOS, type BrandLogo } from './destinationLogos'

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

export interface DestinationMeta {
  name: string
  /** Fallback mark: one or two initials, drawn when there is no brand logo. */
  glyph: string
  /** Tailwind chip classes for the fallback mark. */
  className: string
  /** Brand mark to draw instead of the initials, when we ship one. */
  logo?: BrandLogo
  /** Readable ink colour for the mark, against `logo.hex`. */
  logoColor?: string
}

/** Display names for the destinations the design names explicitly. */
const KNOWN_NAMES: Record<KnownDestinationId, string> = {
  facebook: 'Facebook',
  snapchat: 'Snapchat',
  tiktok: 'TikTok',
  the_trade_desk: 'The Trade Desk',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  x: 'X',
}

/**
 * Platform name (or slug) patterns that resolve to a bundled brand mark.
 * Matched in order against the lower-cased payload name, so the payload's
 * "Yahoo! (fka Verizon Media)"-style suffixes do not prevent a match.
 */
const LOGO_PATTERNS: [RegExp, keyof typeof BRAND_LOGOS][] = [
  [/\bfacebook\b|\bmeta\b/, 'facebook'],
  [/\binstagram\b/, 'instagram'],
  [/\btiktok\b/, 'tiktok'],
  [/\bsnap(chat)?\b/, 'snapchat'],
  [/\bspotify\b/, 'spotify'],
  [/\breddit\b/, 'reddit'],
  [/\broku\b/, 'roku'],
  [/\bnetflix\b/, 'netflix'],
  [/\bpinterest\b/, 'pinterest'],
  [/\byoutube\b/, 'youtube'],
  [/\btwitch\b/, 'twitch'],
  [/\bpandora\b/, 'pandora'],
  [/\bgoogle\b/, 'google'],
  [/\bsamsung\b/, 'samsung'],
  [/\btubi\b/, 'tubi'],
  [/\bfubo(tv)?\b/, 'fubo'],
  [/\bparamount\b/, 'paramountplus'],
  [/\blg\b/, 'lg'],
  [/\bhbo\b|\bhbo ?max\b/, 'max'],
  [/^x$|\btwitter\b/, 'x'],
]

function logoFor(id: DestinationId, name: string): BrandLogo | undefined {
  const haystack = `${name} ${id.replace(/_/g, ' ')}`.toLowerCase()
  for (const [pattern, key] of LOGO_PATTERNS) {
    if (pattern.test(haystack)) return BRAND_LOGOS[key]
  }
  return undefined
}

/** Black or white, whichever stays readable on the given brand colour. */
function inkOn(hex: string) {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#111418' : '#FFFFFF'
}

/**
 * Display names the catalog adapter learned from the payload, keyed by slug.
 * Lets an unknown platform render as "Yahoo! (fka Verizon Media)" rather than
 * a title-cased guess at its slug.
 */
const learnedNames = new Map<string, string>()

export function registerDestinationName(id: DestinationId, name: string) {
  const trimmed = name.trim()
  if (trimmed && !learnedNames.has(id)) learnedNames.set(id, trimmed)
}

/** Palette unknown destinations are assigned from, deterministically. */
const FALLBACK_CLASSES = [
  'bg-[#5B5BD6] text-white',
  'bg-[#0F7B6C] text-white',
  'bg-[#B5480C] text-white',
  'bg-[#8A4FBF] text-white',
  'bg-[#0B6BCB] text-white',
  'bg-[#A32B54] text-white',
  'bg-[#3D5A80] text-white',
  'bg-[#6B7B1F] text-white',
]

function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h)
}

function titleCase(id: string) {
  return id
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Up to two initials, e.g. "Yahoo DSP" -> "YD", "Xandr" -> "X". */
function initials(name: string) {
  const words = name.split(/[^A-Za-z0-9]+/).filter(Boolean)
  if (!words.length) return '?'
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const metaCache = new Map<string, DestinationMeta>()

/**
 * Styling for any destination the backend sends, known or not. Never returns
 * undefined — a platform with no bundled brand mark is drawn as a coloured
 * initials chip rather than dropped.
 */
export function destinationMeta(id: DestinationId): DestinationMeta {
  const name =
    KNOWN_NAMES[id as KnownDestinationId] ?? learnedNames.get(id) ?? titleCase(id)
  const cacheKey = `${id}|${name}`

  let meta = metaCache.get(cacheKey)
  if (!meta) {
    const logo = logoFor(id, name)
    meta = {
      name,
      glyph: initials(name),
      className: FALLBACK_CLASSES[hash(id) % FALLBACK_CLASSES.length],
      logo,
      logoColor: logo ? inkOn(logo.hex) : undefined,
    }
    metaCache.set(cacheKey, meta)
  }
  return meta
}

export function destinationName(id: DestinationId): string {
  return destinationMeta(id).name
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
