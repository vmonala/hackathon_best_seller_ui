import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './client'
import { TAGS_ENABLED } from './config'
import { fetchSegmentIntelMany, fetchTagVocabulary, resolveTagFilter } from './tags'
import type { SegmentQuery, SellerSegmentQuery } from './types'

export const queryKeys = {
  segments: (q: SegmentQuery) => ['segments', q] as const,
  segment: (id: string) => ['segment', id] as const,
  facets: () => ['facets'] as const,
  sellerSegments: (q: SellerSegmentQuery) => ['seller-segments', q] as const,
  sellerSegment: (id: string) => ['seller-segment', id] as const,
  sellerSummary: () => ['seller-summary'] as const,
  platforms: () => ['seller-platforms'] as const,
  platformSegments: (id: string) => ['seller-platform-segments', id] as const,
  segmentIntel: (key: string) => ['segment-intel', key] as const,
  tagVocabulary: () => ['tag-vocabulary'] as const,
}

/**
 * A page of segments.
 *
 * Selected tags are resolved to segment ids first: the catalog rows carry no
 * tags of their own, so the filter has to come from the Segment Intelligence
 * API before the in-memory query can run. `resolveTagFilter` caches each tag's
 * id set for the tab, so this is one round trip the first time a tag is picked
 * and free afterwards.
 */
export function useSegments(query: SegmentQuery) {
  return useQuery({
    queryKey: queryKeys.segments(query),
    queryFn: async () => {
      const tagIds = await resolveTagFilter(query.tags)
      return api.listSegments(query, tagIds)
    },
    placeholderData: (prev) => prev,
  })
}

/**
 * The tag vocabulary, for the tag filter's option list. Live-only, like every
 * other read from the Segment Intelligence API.
 */
export function useTagVocabulary() {
  return useQuery({
    queryKey: queryKeys.tagVocabulary(),
    queryFn: fetchTagVocabulary,
    enabled: TAGS_ENABLED,
    staleTime: Infinity,
  })
}

export function useSegment(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.segment(id ?? ''),
    queryFn: () => api.getSegment(id!),
    enabled: Boolean(id),
  })
}

/**
 * Tags — and, when `TAGS_REACH_ENABLED`, measured reach — for the segments
 * currently on screen, from the Segment Intelligence API.
 *
 * Deliberately a hook of its own rather than part of `listSegments`: it keeps a
 * second backend off the table's critical path, so rows paint immediately and
 * the chips fill in behind them. It also leaves `SegmentsApi` and the mock
 * adapter untouched.
 *
 * The key is order-independent, so re-sorting a page it has already fetched is
 * a cache hit. `src/api/tags.ts` caches per id on top of that, so paging back to
 * a page already seen issues no requests at all.
 */
export function useSegmentIntel(ids: string[]) {
  const key = [...ids].sort().join(',')
  return useQuery({
    queryKey: queryKeys.segmentIntel(key),
    queryFn: () => fetchSegmentIntelMany(ids),
    enabled: TAGS_ENABLED && ids.length > 0,
    staleTime: Infinity,
    // Matches useSegments: hold the previous page's chips rather than flashing
    // an empty label row while the next page loads.
    placeholderData: (prev) => prev,
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

/* ---------- Data Seller Insights ---------- */

export function useSellerSegments(query: SellerSegmentQuery) {
  return useQuery({
    queryKey: queryKeys.sellerSegments(query),
    queryFn: () => api.listSellerSegments(query),
    placeholderData: (prev) => prev,
  })
}

export function useSellerSegment(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sellerSegment(id ?? ''),
    queryFn: () => api.getSellerSegment(id!),
    enabled: Boolean(id),
  })
}

export function useSellerSummary() {
  return useQuery({
    queryKey: queryKeys.sellerSummary(),
    queryFn: () => api.getSellerSummary(),
    staleTime: 5 * 60_000,
  })
}

export function usePlatforms() {
  return useQuery({
    queryKey: queryKeys.platforms(),
    queryFn: () => api.getPlatforms(),
    staleTime: 5 * 60_000,
  })
}

export function usePlatformSegments(platformId: string | null) {
  return useQuery({
    queryKey: queryKeys.platformSegments(platformId ?? ''),
    queryFn: () => api.getPlatformSegments(platformId!),
    enabled: Boolean(platformId),
  })
}
