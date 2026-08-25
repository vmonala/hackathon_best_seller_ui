import { useCallback, useMemo, useState } from 'react'
import { useAskDiscovery, useFacets, useSegments } from '@/api/queries'
import type { SortKey } from '@/api/types'
import { useSegmentQueryParams } from '@/lib/useSegmentQueryParams'
import { FilterBar } from '@/components/FilterBar'
import { FilterChips } from '@/components/FilterChips'
import { SegmentsTable } from '@/components/SegmentsTable'
import { DiscoveryPanel } from '@/components/DiscoveryPanel'
import { formatNumber } from '@/lib/labels'

export function SegmentsPage() {
  const { query, update, toggleIn, clearAll, activeFilterCount } =
    useSegmentQueryParams()
  const { data: facets } = useFacets()
  const { data, isLoading, isError, error } = useSegments(query)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [discoveryOpen, setDiscoveryOpen] = useState(false)
  const discovery = useAskDiscovery()

  const rows = useMemo(() => {
    const items = data?.items ?? []
    // When the AI has answered, the left table narrows to its candidate set.
    if (discoveryOpen && discovery.data) {
      const ids = new Set(discovery.data.candidateSegmentIds)
      return items.filter((s) => ids.has(s.id))
    }
    return items
  }, [data?.items, discoveryOpen, discovery.data])

  const toggleRow = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev)
        rows.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)))
        return next
      })
    },
    [rows],
  )

  const handleSort = useCallback(
    (key: SortKey) => {
      if (query.sort === key) {
        update({ direction: query.direction === 'asc' ? 'desc' : 'asc' })
      } else {
        update({ sort: key, direction: 'desc' })
      }
    },
    [query.sort, query.direction, update],
  )

  const showingAiResults = discoveryOpen && Boolean(discovery.data)
  // The rail count is the AI's shortlist; totalCandidates is the wider pool it
  // considered and is shown separately so the two numbers never contradict.
  const total = showingAiResults
    ? discovery.data!.candidateSegmentIds.length
    : (data?.total ?? 0)

  return (
    <div className="flex min-h-0 flex-1">
      <main className="min-w-0 flex-1 overflow-y-auto px-[30px] pt-[26px]">
        <h1 className="m-0 flex items-start gap-1.5 text-[38px] font-bold leading-tight tracking-[-0.6px]">
          Data Marketplace Segments
          <span
            title="Labels are computed from aggregated, delivered marketplace usage."
            className="mt-1 flex h-[15px] w-[15px] cursor-help items-center justify-center rounded-full bg-[#2F80ED] text-[10px] font-bold text-white"
          >
            ?
          </span>
        </h1>
        <p className="my-[9px] mb-5 text-[14.5px] text-muted">
          Browse and request Data Marketplace segments so that you can distribute them
          to destination platforms.
        </p>

        <FilterBar
          query={query}
          facets={facets}
          onUpdate={update}
          onToggle={toggleIn}
          activeFilterCount={activeFilterCount}
          onOpenDiscovery={() => setDiscoveryOpen(true)}
          compact={discoveryOpen}
        />

        {showingAiResults ? (
          <div className="mt-3.5 flex items-center gap-2 text-[13.5px] text-muted">
            <span>Showing AI results</span>
            <b className="text-ink">
              · {rows.length} of {discovery.data!.totalCandidates}
            </b>
            <button
              onClick={() => discovery.reset()}
              className="ml-2 text-[12.5px] text-indigo-ink underline hover:no-underline"
            >
              Show all segments
            </button>
          </div>
        ) : (
          <FilterChips
            query={query}
            facets={facets}
            onToggle={toggleIn}
            onUpdate={update}
            onClearAll={clearAll}
          />
        )}

        {isError ? (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            Failed to load segments: {(error as Error).message}
          </div>
        ) : (
          <SegmentsTable
            rows={rows}
            selected={selected}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            isLoading={isLoading}
            compact={discoveryOpen}
            sort={query.sort}
            direction={query.direction}
            onSort={handleSort}
          />
        )}

        <div className="mt-0.5 flex items-center gap-2 border-t border-line px-0.5 py-4 text-[13.5px] text-[#3C4043]">
          <b>{selected.size}</b>&nbsp;Segments of <b>{formatNumber(total)}</b> Selected
          {!showingAiResults && activeFilterCount > 0 && data && (
            <span className="text-muted2">
              · filtered from {formatNumber(data.totalBeforeLabelFilters ?? data.totalUnfiltered)}{' '}
              by performance labels
            </span>
          )}
          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="ml-3 text-[12.5px] text-indigo-ink underline hover:no-underline"
            >
              Clear selection
            </button>
          )}
        </div>
      </main>

      {discoveryOpen ? (
        <DiscoveryPanel
          onClose={() => setDiscoveryOpen(false)}
          onAsk={(q) => discovery.mutate(q)}
          isPending={discovery.isPending}
          result={discovery.data}
          error={discovery.error as Error | null}
        />
      ) : (
        <button
          onClick={() => setDiscoveryOpen(true)}
          className="h-full shrink-0 rounded-l-md bg-green px-[7px] py-4 text-[12.5px] font-bold text-[#04331E]"
          style={{ writingMode: 'vertical-rl' }}
        >
          Ask the Data Marketplace
        </button>
      )}
    </div>
  )
}
