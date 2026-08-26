import type { FacetOption, PlatformPerformance, SellerSegment } from '@/api/types'

/**
 * A segment's category is the node just below the seller root, e.g.
 * "123Push > Consumer > Health and Wellness > Dry Eyes" → "Consumer".
 * Paths with no separator have no category and never match a filter.
 */
export function categoryOf(fullPath: string): string | null {
  const parts = fullPath.split('>').map((p) => p.trim())
  return parts.length > 1 && parts[1] ? parts[1] : null
}

/** Category options with real counts, derived from the loaded seller catalogue. */
export function categoryOptions(segments: SellerSegment[] | undefined): FacetOption[] {
  const counts = new Map<string, number>()
  for (const s of segments ?? []) {
    const c = categoryOf(s.fullPath)
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/** Each platform is a destination; the option value is the platform id. */
export function destinationOptions(
  platforms: PlatformPerformance[] | undefined,
): FacetOption[] {
  return (platforms ?? []).map((p) => ({
    value: p.id,
    label: p.name,
    count: p.activeSegments,
  }))
}

/** Empty selection means "no filter", matching the buyer-side facet behaviour. */
export function matchesCategories(fullPath: string, selected: string[]): boolean {
  if (!selected.length) return true
  const c = categoryOf(fullPath)
  return c !== null && selected.includes(c)
}
