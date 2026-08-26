import { useEffect, useMemo, useState } from 'react'
import type { FacetOption, SegmentFacets, SegmentQuery } from '@/api/types'
import type { DestinationId, SegmentLabel } from '@/api/types'
import type { FilterKey } from '@/lib/useSegmentQueryParams'
import { LABEL_META } from '@/lib/labels'
import { FacetDropdown } from './FacetDropdown'
import { cn } from '@/lib/cn'

const LABELS_HINT =
  'Labels are awarded from catalogue-wide cut-offs on measured reach, active buyers, impressions delivered in the last 90 days, platform breadth and how recently the segment was added. Each option names its own criteria on hover; picking more labels widens the results.'

interface FilterBarProps {
  query: SegmentQuery
  facets?: SegmentFacets
  onUpdate: (patch: Partial<SegmentQuery>) => void
  onToggle: (key: FilterKey, value: string) => void
  activeFilterCount: number
  onOpenDiscovery: () => void
  compact?: boolean
}

export function FilterBar({
  query,
  facets,
  onUpdate,
  onToggle,
  activeFilterCount,
  onOpenDiscovery,
  compact,
}: FilterBarProps) {
  const [search, setSearch] = useState(query.search ?? '')

  // One list now: labels are the catalogue's whole vocabulary, counted over the
  // same rows the table pages through, with each option's criteria as its hint.
  const labelOptions = useMemo<FacetOption[]>(
    () =>
      (facets?.labels ?? []).map((o) => ({
        ...o,
        label: `${LABEL_META[o.value].icon} ${o.label}`,
      })),
    [facets?.labels],
  )

  // Debounce typing so we do not refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== (query.search ?? '')) onUpdate({ search })
    }, 300)
    return () => clearTimeout(t)
  }, [search, query.search, onUpdate])

  useEffect(() => {
    setSearch(query.search ?? '')
  }, [query.search])

  return (
    <div className="flex flex-wrap items-center gap-[11px]">
      <div
        className={cn('field gap-2.5', compact ? 'w-[250px]' : 'w-[352px]')}
      >
        <span className="text-sm text-muted">⌕</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Describe your target audience"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted2"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="text-[11px] text-muted2 hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>

      <FacetDropdown
        width={280}
        trigger={
          <button
            className={cn('field', (query.statuses?.length ?? 0) > 0 && 'field-on')}
          >
            Status
            <span className="text-[9px]">▾</span>
          </button>
        }
        sections={[
          {
            title: 'Status',
            hint: 'Filter by your request status for each segment.',
            options: facets?.statuses ?? [],
            selected: query.statuses ?? [],
            onToggle: (v) => onToggle('statuses', v),
          },
        ]}
        onClearAll={() => onUpdate({ statuses: [] })}
      />

      <FacetDropdown
        width={300}
        trigger={
          <button
            className={cn('field', (query.sellers?.length ?? 0) > 0 && 'field-on')}
          >
            Sellers
            <span className="text-[9px]">▾</span>
          </button>
        }
        sections={[
          {
            title: 'Sellers',
            hint: 'Show segments from selected data providers only.',
            options: facets?.sellers ?? [],
            selected: query.sellers ?? [],
            onToggle: (v) => onToggle('sellers', v),
          },
        ]}
        onClearAll={() => onUpdate({ sellers: [] })}
      />

      {!compact && (
        <FacetDropdown
          trigger={
            <button className={cn('field', activeFilterCount > 0 && 'field-on')}>
              More Filters
              {activeFilterCount > 0 && (
                <span className="rounded-[10px] bg-indigo px-[7px] py-px text-[11.5px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
              <span className="text-[9px]">▾</span>
            </button>
          }
          sections={[
            {
              title: 'Segment labels',
              hint: LABELS_HINT,
              options: labelOptions,
              selected: query.labels ?? [],
              onToggle: (v) => onToggle('labels', v as SegmentLabel),
            },
            {
              title: 'Proven on destination',
              hint: 'Only shows segments actively distributed to the platforms you select.',
              options: facets?.destinations ?? [],
              selected: query.destinations ?? [],
              onToggle: (v) => onToggle('destinations', v as DestinationId),
            },
          ]}
          onClearAll={() => onUpdate({ labels: [], destinations: [] })}
        />
      )}

      {!compact && (
        <>
          <div className="flex-1" />
          <button
            onClick={onOpenDiscovery}
            className="flex h-[41px] items-center gap-2 rounded-md bg-indigo-soft px-[17px] text-sm font-semibold text-indigo-ink transition-colors hover:bg-indigo hover:text-white"
          >
            <span>✦</span>Discover
          </button>
          <button className="flex h-[41px] items-center rounded-md border border-[#B9BDC4] bg-white px-[17px] text-sm font-semibold hover:bg-line2">
            Download Full Catalog
          </button>
        </>
      )}
    </div>
  )
}
