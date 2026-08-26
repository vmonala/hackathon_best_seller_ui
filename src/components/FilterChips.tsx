import type { SegmentFacets, SegmentQuery, SortKey } from '@/api/types'
import { LABEL_META, DESTINATION_META } from '@/lib/labels'
import { SORT_OPTIONS } from '@/lib/metricLabels'
import type { DestinationId, PerformanceLabel } from '@/api/types'

interface FilterChipsProps {
  query: SegmentQuery
  facets?: SegmentFacets
  onToggle: (
    key: 'labels' | 'destinations' | 'sellers' | 'statuses',
    value: string,
  ) => void
  onUpdate: (patch: Partial<SegmentQuery>) => void
  onClearAll: () => void
}

export function FilterChips({
  query,
  facets,
  onToggle,
  onUpdate,
  onClearAll,
}: FilterChipsProps) {
  const chips: { key: 'labels' | 'destinations' | 'sellers' | 'statuses'; value: string; text: string }[] = [
    ...(query.labels ?? []).map((l: PerformanceLabel) => ({
      key: 'labels' as const,
      value: l,
      text: LABEL_META[l].text,
    })),
    ...(query.destinations ?? []).map((d: DestinationId) => ({
      key: 'destinations' as const,
      value: d,
      text: `Proven on ${DESTINATION_META[d].name}`,
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

      {chips.length > 0 && (
        <button
          onClick={onClearAll}
          className="text-[12.5px] text-indigo-ink underline hover:no-underline"
        >
          Clear all filters
        </button>
      )}

      <div className="ml-auto flex items-center gap-[7px] rounded-md border border-[#C9CDD3] bg-white px-3 py-[7px] text-[13px]">
        <label htmlFor="sort" className="text-muted">
          Sort:
        </label>
        <select
          id="sort"
          value={query.sort}
          onChange={(e) => onUpdate({ sort: e.target.value as SortKey })}
          className="cursor-pointer bg-transparent font-bold text-ink outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            onUpdate({ direction: query.direction === 'asc' ? 'desc' : 'asc' })
          }
          aria-label="Toggle sort direction"
          className="text-[11px] text-muted hover:text-ink"
        >
          {query.direction === 'asc' ? '▲' : '▼'}
        </button>
      </div>
    </div>
  )
}
