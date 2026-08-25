import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
  DestinationId,
  PerformanceLabel,
  SegmentQuery,
  SortKey,
} from '@/api/types'

/**
 * Keeps all filter/sort state in the URL so views are shareable and the
 * back button works. This is the single source of truth for the list page.
 */
export function useSegmentQueryParams() {
  const [params, setParams] = useSearchParams()

  const query = useMemo<SegmentQuery>(
    () => ({
      search: params.get('q') ?? '',
      labels: params.getAll('label') as PerformanceLabel[],
      destinations: params.getAll('dest') as DestinationId[],
      sellers: params.getAll('seller'),
      statuses: params.getAll('status'),
      sort: (params.get('sort') as SortKey | null) ?? 'marketplace_score',
      direction: (params.get('dir') as 'asc' | 'desc' | null) ?? 'desc',
      page: Math.max(1, Number(params.get('page')) || 1),
      pageSize: 25,
    }),
    [params],
  )

  const update = useCallback(
    (patch: Partial<SegmentQuery>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const setMulti = (key: string, values?: string[]) => {
            if (values === undefined) return
            next.delete(key)
            values.forEach((v) => next.append(key, v))
          }

          if (patch.search !== undefined) {
            patch.search ? next.set('q', patch.search) : next.delete('q')
          }
          setMulti('label', patch.labels)
          setMulti('dest', patch.destinations)
          setMulti('seller', patch.sellers)
          setMulti('status', patch.statuses)
          if (patch.sort) next.set('sort', patch.sort)
          if (patch.direction) next.set('dir', patch.direction)

          // Any filter change resets pagination.
          if (patch.page !== undefined) next.set('page', String(patch.page))
          else next.delete('page')

          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const toggleIn = useCallback(
    (key: 'labels' | 'destinations' | 'sellers' | 'statuses', value: string) => {
      const current: string[] = query[key] ?? []
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]

      switch (key) {
        case 'labels':
          update({ labels: next as PerformanceLabel[] })
          break
        case 'destinations':
          update({ destinations: next as DestinationId[] })
          break
        case 'sellers':
          update({ sellers: next })
          break
        case 'statuses':
          update({ statuses: next })
          break
      }
    },
    [query, update],
  )

  const clearAll = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  const activeFilterCount =
    (query.labels?.length ?? 0) + (query.destinations?.length ?? 0)

  return { query, update, toggleIn, clearAll, activeFilterCount }
}
