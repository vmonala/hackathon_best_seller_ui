import { useEffect, useMemo, useState } from 'react'
import type { FacetOption, SegmentFacets, SegmentQuery } from '@/api/types'
import type { DestinationId, PerformanceLabel } from '@/api/types'
import { useTagVocabulary } from '@/api/queries'
import { TAGS_ENABLED } from '@/api/config'
import type { FilterKey } from '@/lib/useSegmentQueryParams'
import { tagIcon } from '@/lib/labels'
import { FacetDropdown } from './FacetDropdown'
import { cn } from '@/lib/cn'

/**
 * Performance labels and segment tags read as one list — both answer "how has
 * this segment actually done" — but they come from different backends and
 * different query keys, so their option values are namespaced.
 */
const LABEL_PREFIX = 'label:'
const TAG_PREFIX = 'tag:'

const PERFORMANCE_HINT = TAGS_ENABLED
  ? 'Labels are earned from delivered usage across LiveRamp destinations over the last 90 days; tags are awarded from catalogue-wide cut-offs on distribution, reach and platform breadth. Picking more labels widens the results; picking more tags narrows them.'
  : 'Labels are earned from delivered usage across LiveRamp destinations over the last 90 days. Updated weekly.'

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

  // Tags are the Segment Intelligence API's vocabulary, not a catalog facet, so
  // they arrive on their own and are absent in mock mode.
  const { data: tags, isLoading: tagsLoading } = useTagVocabulary()

  /**
   * Labels and tags share one heading in the dropdown but live on different
   * query keys, so each option carries the key it belongs to as a prefix and
   * `togglePerformance` routes it back. Labels come first — they are the
   * catalog's own vocabulary — with the tags service's badges beneath them.
   */
  const performanceOptions = useMemo<FacetOption[]>(
    () => [
      ...(facets?.performanceLabels ?? []).map((o) => ({
        ...o,
        value: `${LABEL_PREFIX}${o.value}`,
      })),
      ...(TAGS_ENABLED ? (tags ?? []) : []).map((t) => ({
        value: `${TAG_PREFIX}${t.key}`,
        label: `${tagIcon(t)} ${t.name}`,
        // No count: the tags service counts over its own ~198k-row catalog,
        // which is not the set this table pages through.
        hint: t.description,
      })),
    ],
    [facets?.performanceLabels, tags],
  )

  const performanceSelected = useMemo(
    () => [
      ...(query.labels ?? []).map((l) => `${LABEL_PREFIX}${l}`),
      ...(query.tags ?? []).map((t) => `${TAG_PREFIX}${t}`),
    ],
    [query.labels, query.tags],
  )

  const togglePerformance = (value: string) =>
    value.startsWith(TAG_PREFIX)
      ? onToggle('tags', value.slice(TAG_PREFIX.length))
      : onToggle('labels', value.slice(LABEL_PREFIX.length) as PerformanceLabel)

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
              title: 'Marketplace performance',
              hint: PERFORMANCE_HINT,
              options: performanceOptions,
              loading: tagsLoading,
              selected: performanceSelected,
              onToggle: togglePerformance,
            },
            {
              title: 'Proven on destination',
              hint: 'Only shows segments with delivered impressions on the platforms you select.',
              options: facets?.destinations ?? [],
              selected: query.destinations ?? [],
              onToggle: (v) => onToggle('destinations', v as DestinationId),
            },
          ]}
          onClearAll={() => onUpdate({ labels: [], tags: [], destinations: [] })}
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
