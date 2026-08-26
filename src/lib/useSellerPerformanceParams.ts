import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Performance-tab filter state, held in the URL so the view is shareable and
 * the back button steps through filter changes. Mirrors the buyer-side
 * useSegmentQueryParams conventions: repeated keys for multi-select, and
 * replace-mode writes so typing does not flood history.
 */
export function useSellerPerformanceParams() {
  const [params, setParams] = useSearchParams()

  const categories = useMemo(() => params.getAll('cat'), [params])
  const destinations = useMemo(() => params.getAll('dest'), [params])

  const setMulti = useCallback(
    (key: 'cat' | 'dest', values: string[]) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete(key)
          values.forEach((v) => next.append(key, v))
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const setCategories = useCallback(
    (values: string[]) => setMulti('cat', values),
    [setMulti],
  )
  const setDestinations = useCallback(
    (values: string[]) => setMulti('dest', values),
    [setMulti],
  )

  /** Clears the filters only — the active tab and any other params survive. */
  const clearAll = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('cat')
        next.delete('dest')
        return next
      },
      { replace: true },
    )
  }, [setParams])

  return {
    categories,
    destinations,
    setCategories,
    setDestinations,
    clearAll,
    filterCount: categories.length + destinations.length,
  }
}
