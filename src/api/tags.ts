import { apiFetch, ApiError } from './http'
import { TAGS_API_BASE_URL, TAGS_REACH_ENABLED } from './config'
import type { SegmentIntelRow, SegmentTagRow, TagSegmentsPage } from './backend'
import type { SegmentTag } from './types'

/**
 * The only place that talks to the Segment Intelligence API.
 *
 * That service is a second backend on its own origin (see `TAGS_API_BASE_URL`).
 * It carries a much larger catalog than the one the app renders — ~198k rows
 * against ~14.6k — and exposes no search, filter or field projection, so
 * bulk-loading it the way `liveCatalog.ts` loads the catalog API is not an
 * option: a full sweep is ~992 requests and ~830MB.
 *
 * What it does serve cheaply is one segment's tags: `GET /v1/segments/{id}/tags`
 * is 774 bytes and a few milliseconds. So tags are fetched for the rows actually
 * on screen and cached for the lifetime of the tab — a 50-row page costs ~40KB.
 *
 * Filtering *by* tag runs the other way round, through
 * `GET /v1/tags/{slug}/segments`, which pages bare segment ids — see
 * `resolveTagFilter`.
 */

/** Concurrent per-segment fetches. Small enough not to starve the page's own requests. */
const CONCURRENCY = 8

function tagsFetch<T>(path: string, params?: Record<string, number | string>) {
  return apiFetch<T>(path, { baseUrl: TAGS_API_BASE_URL, params })
}

function mapTag(row: SegmentTagRow): SegmentTag {
  return {
    key: row.tag_key,
    name: row.display_name,
    description: row.description,
    category: row.category,
    priority: row.priority,
  }
}

const byPriority = (a: SegmentTag, b: SegmentTag) => a.priority - b.priority

/** Drops every cached read, so the next one re-fetches. */
export function invalidateTags() {
  bySegment.clear()
  bySlug.clear()
  vocabulary = undefined
}

/* ---------- The vocabulary ---------- */

let vocabulary: Promise<SegmentTag[]> | undefined

/**
 * Every tag the service can award — 11 today — in priority order. This is the
 * option list for the tag filter, and it is small enough to hold for the tab.
 */
export function fetchTagVocabulary(): Promise<SegmentTag[]> {
  if (!vocabulary) {
    vocabulary = tagsFetch<SegmentTagRow[]>('/tags')
      .then((rows) => rows.map(mapTag).sort(byPriority))
      .catch((err) => {
        vocabulary = undefined
        throw err
      })
  }
  return vocabulary
}

/* ---------- Filtering by tag ---------- */

/** Max the reverse-lookup route accepts. */
const TAG_PAGE_SIZE = 200

const bySlug = new Map<string, Promise<Set<string>>>()

function tagSegmentsPage(slug: string, page: number) {
  return tagsFetch<TagSegmentsPage>(`/tags/${encodeURIComponent(slug)}/segments`, {
    page,
    size: TAG_PAGE_SIZE,
  })
}

/**
 * Every segment id carrying `slug`, as strings to match `Segment.id`.
 *
 * `GET /v1/tags/{slug}/segments` pages ids and nothing else, so even the widest
 * tag — "Highly Distributed", ~111k ids — is a few hundred 2KB requests rather
 * than the ~830MB a catalog sweep would cost. Page 1 reports the total, so the
 * rest are issued together, capped at `CONCURRENCY`. The set is cached for the
 * tab: selecting the same tag again, or re-sorting and re-paging under it, is
 * free.
 */
function fetchTagSegmentIds(slug: string): Promise<Set<string>> {
  let pending = bySlug.get(slug)
  if (!pending) {
    pending = loadTagSegmentIds(slug).catch((err) => {
      bySlug.delete(slug)
      throw err
    })
    bySlug.set(slug, pending)
  }
  return pending
}

async function loadTagSegmentIds(slug: string): Promise<Set<string>> {
  const first = await tagSegmentsPage(slug, 1)
  const ids = new Set(first.items.map(String))

  const totalPages = first.pagination.total_pages
  let next = 2
  const worker = async () => {
    for (let page = next++; page <= totalPages; page = next++) {
      const { items } = await tagSegmentsPage(slug, page)
      for (const id of items) ids.add(String(id))
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, Math.max(0, totalPages - 1)) }, worker),
  )
  return ids
}

/**
 * The segment ids allowed by the selected tags, or `null` when no tag is
 * selected and the filter should not narrow anything.
 *
 * Tags are AND-ed — "Buyer Magnet *and* High iOS Reach" is the question a buyer
 * stacking them is asking — so this is the intersection. The narrowest tag is
 * resolved first and each further tag intersects into it, which keeps the
 * working set small.
 */
export async function resolveTagFilter(
  slugs: string[] | undefined,
): Promise<Set<string> | null> {
  if (!slugs?.length) return null

  const sets = await Promise.all(slugs.map(fetchTagSegmentIds))
  const [smallest, ...rest] = [...sets].sort((a, b) => a.size - b.size)

  let out = smallest
  for (const other of rest) {
    out = new Set([...out].filter((id) => other.has(id)))
    if (!out.size) break
  }
  return out
}

/* ---------- Per-segment lookups ---------- */

/**
 * What the tags API can tell us about one segment. `reach` is present only when
 * `TAGS_REACH_ENABLED` is on *and* the row route answered — see
 * `fetchSegmentIntel`.
 */
export interface SegmentIntel {
  tags: SegmentTag[]
  reach?: {
    cookieReach: number
    iosReach: number
    androidReach: number
    inputRecords: number
    /** ISO date the reach figures were measured, or undefined. */
    reachAsOf?: string
  }
}

const EMPTY: SegmentIntel = { tags: [] }

/**
 * Resolved segments *and* in-flight requests, so an overlapping page change or
 * a re-render never refetches an id already being fetched.
 */
const bySegment = new Map<string, Promise<SegmentIntel>>()

function mapReach(row: SegmentIntelRow): SegmentIntel['reach'] {
  return {
    cookieReach: row.cookie_reach,
    iosReach: row.ios_reach,
    androidReach: row.android_reach,
    inputRecords: row.input_records,
    // The API sends a full timestamp; the UI's date formatter wants a bare date.
    reachAsOf: row.cookie_reach_updated_at?.slice(0, 10),
  }
}

/**
 * Everything the tags API has on one segment.
 *
 * With `TAGS_REACH_ENABLED` off — the default — this is one call to
 * `/segments/{id}/tags`. With it on, it tries `/segments/{id}` first, which
 * carries the tags *and* the measured reach in a single response, and falls
 * back to the tags route when that row route is absent (it 404s today).
 */
function fetchIntel(id: string): Promise<SegmentIntel> {
  const path = `/segments/${encodeURIComponent(id)}`

  const tagsOnly = () =>
    tagsFetch<SegmentTagRow[]>(`${path}/tags`).then((rows) => ({
      tags: rows.map(mapTag).sort(byPriority),
    }))

  if (!TAGS_REACH_ENABLED) return tagsOnly()

  return tagsFetch<SegmentIntelRow>(path)
    .then((row) => ({
      tags: (row.tags ?? []).map(mapTag).sort(byPriority),
      reach: mapReach(row),
    }))
    .catch((err) => {
      // The row route is not implemented yet. Degrade to tags and let the
      // catalog adapter keep its derived reach figures.
      if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        return tagsOnly()
      }
      throw err
    })
}

export function fetchSegmentIntel(id: string): Promise<SegmentIntel> {
  let pending = bySegment.get(id)
  if (!pending) {
    pending = fetchIntel(id).catch((err) => {
      // A segment the tags API has never seen 404s on both routes. That is a
      // legitimate empty result, not an outage, so it caches like any other.
      if (err instanceof ApiError && err.status === 404) return EMPTY
      bySegment.delete(id)
      throw err
    })
    bySegment.set(id, pending)
  }
  return pending
}

/**
 * A page of segments. An id that fails resolves to nothing rather than failing
 * the batch — a missing chip must never blank out a row.
 */
export async function fetchSegmentIntelMany(
  ids: string[],
): Promise<Map<string, SegmentIntel>> {
  const unique = [...new Set(ids)]
  const out = new Map<string, SegmentIntel>()

  let next = 0
  const worker = async () => {
    for (let i = next++; i < unique.length; i = next++) {
      const id = unique[i]
      out.set(id, await fetchSegmentIntel(id).catch(() => EMPTY))
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, unique.length) }, worker),
  )
  return out
}
