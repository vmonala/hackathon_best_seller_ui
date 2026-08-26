import type { SegmentFacets, SegmentQuery } from '@/api/types'
import type { FilterKey } from '@/lib/useSegmentQueryParams'
import { LABEL_META, destinationName } from '@/lib/labels'
import type { DestinationId, SegmentLabel } from '@/api/types'

interface FilterChipsProps {
  query: SegmentQuery
  facets?: SegmentFacets
  onToggle: (key: FilterKey, value: string) => void
  onClearAll: () => void
}

/**
 * The active filters, each removable. Sorting is not offered here — it is done
 * by clicking a column header in `SegmentsTable`.
 */
export function FilterChips({
  query,
  facets,
  onToggle,
  onClearAll,
}: FilterChipsProps) {
  const chips: { key: FilterKey; value: string; text: string }[] = [
    ...(query.labels ?? []).map((l: SegmentLabel) => ({
      key: 'labels' as const,
      value: l,
      text: `${LABEL_META[l].icon} ${LABEL_META[l].text}`,
    })),
    ...(query.destinations ?? []).map((d: DestinationId) => ({
      key: 'destinations' as const,
      value: d,
      text: `Proven on ${destinationName(d)}`,
    })),
    ...(query.sellers ?? []).map((s) => ({
      key: 'sellers' as const,
      value: s,
      text: s,
    })),
    ...(query.statuses ?? []).map((s) => ({
      key: 'statuses' as const,
      value: s,
      text:
        facets?.statuses.find((o) => o.value === s)?.label ?? s,
    })),
  ]

  // Nothing to show, and no sort control to hold the row open anymore.
  if (chips.length === 0) return null

  return (
    <div className="my-[18px] mb-1 flex flex-wrap items-center gap-2.5 text-[13.5px] text-muted">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          onClick={() => onToggle(chip.key, chip.value)}
          className="inline-flex items-center gap-[7px] rounded-[14px] border border-[#E1E4E8] bg-line2 px-[11px] py-1 text-[12.5px] text-[#3C4043] hover:border-indigo hover:text-indigo-ink"
        >
          {chip.text}
          <span className="text-[11px] text-muted2">✕</span>
        </button>
      ))}

      <button
        onClick={onClearAll}
        className="text-[12.5px] text-indigo-ink underline hover:no-underline"
      >
        Clear all filters
      </button>
    </div>
  )
}
