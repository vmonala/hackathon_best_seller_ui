import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { SegmentQuery } from './types'

export const queryKeys = {
  segments: (q: SegmentQuery) => ['segments', q] as const,
  segment: (id: string) => ['segment', id] as const,
  facets: () => ['facets'] as const,
}

export function useSegments(query: SegmentQuery) {
  return useQuery({
    queryKey: queryKeys.segments(query),
    queryFn: () => api.listSegments(query),
    placeholderData: (prev) => prev,
  })
}

export function useSegment(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.segment(id ?? ''),
    queryFn: () => api.getSegment(id!),
    enabled: Boolean(id),
  })
}

export function useFacets() {
  return useQuery({
    queryKey: queryKeys.facets(),
    queryFn: () => api.getFacets(),
    staleTime: 5 * 60_000,
  })
}

export function useAskDiscovery() {
  return useMutation({
    mutationFn: (question: string) => api.askDiscovery(question),
  })
}
