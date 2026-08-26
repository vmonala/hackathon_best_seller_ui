import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './client'
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
}

/** A page of segments. Labels ride along on each row, filter included. */
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
