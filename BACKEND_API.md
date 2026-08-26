# Backend API contract

Everything this UI needs from the backend, endpoint by endpoint and field by
field. The frontend is already written against these routes
(`src/api/live.ts`); building a service that matches this document is enough to
switch the app off mock data with a single environment variable.

Source of truth in the repo: `src/api/types.ts` (shapes), `src/api/live.ts`
(routes and query-parameter names), `src/api/mock/index.ts` (filter, sort and
pagination semantics the backend must reproduce).

---

## 1. Overview

### Base URL

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_MODE` | `mock` | `live` switches the app onto the real backend |
| `VITE_API_BASE_URL` | `/api` | Prefix prepended to every path below |
| `VITE_FASTAPI_ORIGIN` | `http://localhost:8000` | Where Vite proxies `/api` in dev |

In development `vite.config.ts` proxies `/api` to `VITE_FASTAPI_ORIGIN` with
`changeOrigin: true`, so **CORS does not need to be configured** while
developing. If you'd rather have the browser call the backend directly, set
`VITE_API_BASE_URL=http://localhost:8000` and add `CORSMiddleware`.

So `GET /segments` in this document means `GET {VITE_API_BASE_URL}/segments` —
by default `GET /api/segments`, proxied to `http://localhost:8000/segments`.

### Endpoints

| Method | Path | Returns | Used by |
| --- | --- | --- | --- |
| `GET` | `/segments` | `Paginated<Segment>` | Segments list page |
| `GET` | `/segments/facets` | `SegmentFacets` | Filter bar popovers |
| `GET` | `/segments/{id}` | `SegmentDetail` | Segment detail page |
| `POST` | `/discovery/ask` | `AiDiscoveryResponse` | AI Segment Discovery panel |

> **Route ordering.** Declare `/segments/facets` **before** `/segments/{id}` in
> FastAPI, or the literal string `facets` gets captured as a segment id.

### JSON conventions

- **Response bodies are camelCase.** Query parameters are snake_case where noted
  (`page_size` is the only one).
- Dates are bare `YYYY-MM-DD` strings. The UI appends `T00:00:00` before parsing,
  so a full ISO timestamp will not format correctly.
- Optional fields (marked `?` below) may be omitted or `null`.
- Several prose fields carry `**bold**` markup — see §7.

---

## 2. Enums / closed vocabularies

The UI looks these values up in lookup tables (`src/lib/labels.ts`). A value
outside these sets renders blank rather than erroring, so treat them as closed.

### `PerformanceLabel`

| Value | Displayed as |
| --- | --- |
| `top_performer` | Top performer |
| `frequently_reused` | Frequently reused |
| `trending_up` | Trending up |
| `proven_multi_platform` | Proven multi-platform |
| `new_gaining_traction` | New & gaining traction |

### `DestinationId`

| Value | Displayed as |
| --- | --- |
| `facebook` | Facebook |
| `snapchat` | Snapchat |
| `tiktok` | TikTok |
| `the_trade_desk` | The Trade Desk |
| `linkedin` | LinkedIn |
| `pinterest` | Pinterest |
| `x` | X |

### `UsageLevel`

| Value | Displayed as |
| --- | --- |
| `very_high` | Very high usage |
| `high` | High usage |
| `moderate` | Moderate usage |
| `low` | Low usage |

### Other

| Type | Values |
| --- | --- |
| `status` | `available`, `requested`, `approved` |
| `SortKey` | `marketplace_score`, `cpc`, `cookie_reach`, `date_added`, `name` |
| `direction` | `asc`, `desc` |
| `attributionConfidence` | `High`, `Medium`, `Low` — **capitalised**, rendered verbatim |

---

## 3. `GET /segments`

Returns one page of segments matching the current filters.

### Query parameters

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `search` | string | — | Free-text search |
| `labels` | list of `PerformanceLabel` | — | Repeated key: `?labels=a&labels=b` |
| `destinations` | list of `DestinationId` | — | Repeated key |
| `sellers` | list of string | — | Repeated key; exact seller names |
| `statuses` | list of string | — | Repeated key |
| `sort` | `SortKey` | `marketplace_score` | |
| `direction` | `asc` \| `desc` | `desc` | |
| `page` | int, 1-based | `1` | |
| `page_size` | int | `25` | **snake_case**; the UI always sends 25 |

List parameters arrive as **repeated keys**, not comma-separated values — the
frontend builds them with `URLSearchParams.append` so they map straight onto
FastAPI `Query(None)` list params.

### Matching semantics — the backend must mirror these exactly

These rules come from `src/api/mock/index.ts` and are relied on by the facet
counts and the results footer:

- **`search`** — case-insensitive substring match against `fullPath` **or**
  `seller`. There is also a whitespace-stripped pass over `fullPath`, so
  `"smart watch"` matches `"Smartwatch"`.
- **`labels` are OR-ed.** Selecting two labels *widens* the result set. This
  matches the independent per-label facet counts.
- **`destinations` are AND-ed, and only `live: true` deliveries count.**
  "Proven on Facebook *and* Snapchat" is the activation question buyers ask.
  A segment distributed to a destination but not delivering must not match.
- **`sellers`** — OR-ed exact matches on `seller`.
- **`statuses`** — OR-ed exact matches on `status`.
- `destinations[]` in the response should be **ordered by usage, strongest
  first** — the UI renders them in the order given.

The asymmetry between OR-ed labels and AND-ed destinations is deliberate.

### URL ↔ API parameter mapping

The browser URL uses shorter names than the API. Useful when correlating a
shared UI link with a backend request log (`src/lib/useSegmentQueryParams.ts`):

| Browser URL param | API query param |
| --- | --- |
| `q` | `search` |
| `label` (repeated) | `labels` |
| `dest` (repeated) | `destinations` |
| `seller` (repeated) | `sellers` |
| `status` (repeated) | `statuses` |
| `sort` | `sort` |
| `dir` | `direction` |
| `page` | `page` |
| — (hardcoded 25) | `page_size` |

Search input is debounced 300 ms client-side, so typing does not produce a
request per keystroke.

### Response: `Paginated<Segment>`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `items` | `Segment[]` | yes | This page of results |
| `total` | int | yes | Total rows matching the current filters |
| `totalUnfiltered` | int | yes | Size of the whole catalogue, for the "filtered from N" footer |
| `totalBeforeLabelFilters` | int | no | Matches before performance-label and destination filters were applied |
| `page` | int | yes | Echoes the requested page |
| `pageSize` | int | yes | Echoes the requested page size |

### `Segment`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `id` | string | yes | DMS ID, numeric-as-string (e.g. `"4481902"`) |
| `fullPath` | string | yes | Full taxonomy path, `>`-separated: `"!nsight > Retail > Consumer Electronics > Wearables > Smart Watch Buyers"` |
| `pathPrefix` | string | yes | Everything up to and including the last `>`; rendered grey |
| `name` | string | yes | The leaf name after the last `>`; rendered black |
| `seller` | string | yes | Data seller / provider name |
| `status` | enum | yes | `available` \| `requested` \| `approved` |
| `marketplaceScore` | int 0–100 | yes | Drives the score bar; ≥80 green, ≥60 amber, else grey |
| `labels` | `PerformanceLabel[]` | yes | May be empty; rendered as badges |
| `platformCount` | int | yes | Number of platforms the segment is proven on |
| `destinations` | `DestinationDelivery[]` | yes | Ordered by usage, strongest first |
| `advertiserDirectPctOfMedia` | int | yes | Percent, rendered as `14%` |
| `cpc` | float | yes | USD, rendered `$0.20` |
| `cookieReach` | int | yes | Raw count; the UI formats to `11.7M` / `430K` |
| `dateAdded` | string | yes | `YYYY-MM-DD` |
| `category` | string | yes | Top-level category, e.g. `"Retail"` |
| `iabCategory` | string | no | e.g. `"IAB Shopping > Consumer Electronics"` |

`pathPrefix` and `name` are **required** even though both are derivable from
`fullPath` by splitting on the last `>`. Compute them server-side.

### `DestinationDelivery`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `destination` | `DestinationId` | yes | |
| `channel` | string | no | e.g. `"Advertiser Direct"` |
| `usage` | `UsageLevel` | yes | |
| `note` | string | no | Human-readable provenance, e.g. `"direct audience-level reporting"` |
| `live` | bool | yes | `false` = distributed but not delivering; excluded from destination filtering |

---

## 4. `GET /segments/facets`

Populates the Status, Sellers and More Filters popovers. Takes no parameters.

**Counts are catalogue-wide** and independent of the current query — they tell a
buyer how many segments in the whole marketplace carry each label, not how many
are in the current result set. The UI caches this response for 5 minutes.

### Response: `SegmentFacets`

| Field | Type | Meaning |
| --- | --- | --- |
| `performanceLabels` | `FacetOption[]` | `value` is a `PerformanceLabel` |
| `destinations` | `FacetOption[]` | `value` is a `DestinationId` |
| `sellers` | `FacetOption[]` | `value` is the exact seller name sent back as a `sellers` filter |
| `statuses` | `FacetOption[]` | `value` is `available` \| `requested` \| `approved` |

### `FacetOption`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `value` | string | yes | Sent back verbatim as the filter value |
| `label` | string | yes | Display text |
| `count` | int | yes | Catalogue-wide count, rendered with thousands separators |

This response drives which filter options exist. Adding a destination here is
all that is needed to expose it in the UI.

---

## 5. `GET /segments/{id}`

Returns one segment plus its full performance breakdown. `404` when unknown —
the UI surfaces the `detail` string as the error message.

### Response: `SegmentDetail`

Every field of `Segment` (§3), plus:

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `performance` | `SegmentPerformance` | yes | Marketplace performance tab |

### `SegmentPerformance`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `segmentId` | string | yes | Echoes the segment id |
| `marketplaceScore` | int 0–100 | yes | |
| `scorePercentileNote` | string | yes | Rendered verbatim, e.g. `"Top 5% in Retail · Wearables"` |
| `advertisersUsing90d` | **string** | yes | A band, not a number: `"30+"`, `"15+"`, `"8+"`, `"<5"` |
| `destinationCount` | int | yes | |
| `weeksActive` | int | yes | Weeks with delivery inside the reporting window |
| `weeksInWindow` | int | yes | Window length, e.g. 13. The UI renders "Continuous use, no gaps" when these are equal, otherwise "N weeks inactive" |
| `usageIndex` | `UsagePoint[]` | yes | Sparkline; ~6 points |
| `destinations` | `DestinationDelivery[]` | yes | Per-destination delivery detail |
| `earnedLabels` | `EarnedLabelExplanation[]` | yes | Send an entry for **all five** labels — earned and not |
| `evidence` | `EvidenceQuality` | yes | Evidence-quality rows |

### `UsagePoint`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `period` | string | yes | Axis label, e.g. `"Mar"` or `"2026-03"` |
| `index` | int 0–100 | yes | Indexed to **the segment's own peak**, not to other segments. The UI highlights bars at ≥80% of the max point |

### `EarnedLabelExplanation`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `label` | `PerformanceLabel` | yes | |
| `earned` | bool | yes | `false` entries render as greyed "not earned" rows |
| `explanation` | string | yes | Why it was or wasn't earned; supports `**bold**` |

### `EvidenceQuality`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `attributionConfidence` | `High` \| `Medium` \| `Low` | yes | Capitalised, rendered verbatim |
| `usageDirectlyAttributedPct` | int | yes | Percent |
| `sharedAdGroupAllocationPct` | int | yes | Percent |
| `labelsLastRecomputed` | string | yes | `YYYY-MM-DD` |
| `reportingWindowStart` | string | yes | `YYYY-MM-DD` |
| `reportingWindowEnd` | string | yes | `YYYY-MM-DD` |

---

## 6. `POST /discovery/ask`

Backs the AI Segment Discovery panel.

### Request

```json
{ "question": "Which retail wearables segments deliver on Facebook and Snapchat?" }
```

### Response: `AiDiscoveryResponse`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `id` | string | yes | Response identifier (unused by the UI today) |
| `question` | string | yes | Echo of the question asked |
| `lead` | string | yes | Intro paragraph above the recommendations; supports `**bold**` |
| `recommendations` | `AiRecommendation[]` | yes | Ranked answers |
| `note` | string | yes | Methodology footnote below the list; supports `**bold**` |
| `candidateSegmentIds` | string[] | yes | Every segment considered; **narrows the left-hand table**, so these must be ids `GET /segments` can return |
| `totalCandidates` | int | yes | Size of the pool considered, may exceed `candidateSegmentIds.length` |

### `AiRecommendation`

| Field | Type | Req. | Meaning |
| --- | --- | --- | --- |
| `rank` | int | yes | 1-based |
| `segmentId` | string | yes | |
| `fullPath` | string | yes | |
| `marketplaceScore` | int 0–100 | yes | |
| `labels` | `PerformanceLabel[]` | yes | |
| `platformCount` | int | yes | |
| `extraBadge` | string | no | Free-text badge, e.g. `"Strongest on Snapchat"` |
| `meta` | string[] | yes | Pre-formatted display chips, e.g. `["Facebook **live**", "14% of media", "11.7M cookie reach"]` |
| `why` | string | yes | Prose rationale; supports `**bold**` |

The backend owns all of this copy — the UI does no phrasing or number
formatting for `lead`, `note`, `why` or `meta[]`.

**Streaming:** the UI currently expects a single non-streaming JSON response.
If the backend returns a `StreamingResponse`, `apiFetch` in
`src/api/live.ts` needs to be swapped for a `ReadableStream` reader.

---

## 7. Wire-format landmines

- **camelCase in bodies**, snake_case only for the `page_size` query param.
- **Repeated query keys** for list filters (`?labels=a&labels=b`), never CSV.
- **`pathPrefix` and `name` are required**, even though they are pure
  derivations of `fullPath`.
- **`advertisersUsing90d` is a string band** (`"30+"`, `"15+"`, `"8+"`, `"<5"`),
  not a number.
- **All dates are bare `YYYY-MM-DD`.** Timestamps break date formatting.
- **`**bold**` is the only supported markup** in `lead`, `note`, `why`,
  `meta[]` and `earnedLabels[].explanation`. The renderer is a minimal
  `**bold**` parser (`src/lib/markdown.tsx`) — no links, lists or headings.
- **`pinterest` and `x`** are valid `DestinationId`s but are not currently
  returned as facet options. Add them to `/segments/facets` to expose them.
- **Sorting is entirely server-side.** The table sets `manualSorting: true` and
  never reorders rows itself.

---

## 8. Pagination, sorting, errors, auth

### Pagination

- `page` is **1-based**; default `1`. `page_size` defaults to `25`.
- `total` is the count **after** filtering; `totalUnfiltered` is the whole
  catalogue. The footer reads "Showing X of {total} · filtered from
  {totalBeforeLabelFilters ?? totalUnfiltered} by performance labels".
- Echo `page` and `pageSize` back in the response.
- No pager control is rendered yet, but the contract is already paginated —
  return correct `total` values from day one.

### Sorting

- `sort` must be one of the five `SortKey` values; default `marketplace_score`,
  default `direction` `desc`.
- `name` sorts on the **leaf `name`**, not on `fullPath`.
- `date_added` sorts chronologically, `cpc` and `cookie_reach` numerically.
- Unknown `sort` values should fall back to `marketplace_score` rather than 400.

### Errors

`src/api/http.ts` throws `ApiError(message, status, body)` for any non-2xx.
The message is read from a JSON `detail` field, so **FastAPI's default
`HTTPException` shape works unmodified**:

```json
{ "detail": "Segment 4481902 not found" }
```

| Status | UI behaviour |
| --- | --- |
| `2xx` | Parsed as JSON |
| `204` | Tolerated; resolves to `undefined` |
| `4xx` / `5xx` | `detail` shown as the error message; falls back to `statusText` |

Expected codes: `404` for an unknown segment id, `422` for validation failures
(FastAPI's default), `500` otherwise.

### Auth

**None is sent today.** `apiFetch` sets only `Accept: application/json` and, for
requests with a body, `Content-Type: application/json`. There is no token
handling, no `credentials: 'include'`, no login route and no `401` handling
anywhere in the app. The sidebar tenant string is hardcoded.

This is an open item, not a decision. If the backend needs a bearer token,
session cookie or tenant header, **`src/api/http.ts` is the single place to add
it** — every request in the app goes through `apiFetch`.

---

## 9. Not yet coded, but the UI implies it

Not required to switch off mock data, listed so the backend can plan for them:

| Need | Where it shows up |
| --- | --- |
| Auth / tenant scoping | Entirely absent; sidebar hardcodes a customer id |
| Catalog export | "Download Full Catalog" button in the filter bar is inert |
| Request / licensing action | The table has row selection and a select-all, but nothing acts on the selection |
| Reach breakdowns | Reach tab says "Device- and channel-level reach breakdowns are not wired up yet" |
| Pricing breakdowns | Pricing tab says "Contract-specific rate cards are not wired up yet"; Est. CPM is a hardcoded multiple of `cpc` |
| Discovery conversation persistence | "New Exploration" is a no-op; each ask is independent |
| Discovery prompt suggestions | Three suggested prompts are hardcoded in the panel |
| Filter by segment id | The AI candidate set is intersected client-side; a `segmentIds[]` filter on `/segments` would do this server-side |

---

## 10. Pydantic / FastAPI stubs

Paste-ready models matching the camelCase wire format.

```python
from typing import Generic, List, Literal, Optional, TypeVar

from fastapi import APIRouter, Query
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    """Serialises to camelCase, accepts snake_case internally."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


PerformanceLabel = Literal[
    "top_performer",
    "frequently_reused",
    "trending_up",
    "proven_multi_platform",
    "new_gaining_traction",
]
DestinationId = Literal[
    "facebook", "snapchat", "tiktok", "the_trade_desk", "linkedin", "pinterest", "x"
]
UsageLevel = Literal["very_high", "high", "moderate", "low"]
SegmentStatus = Literal["available", "requested", "approved"]
SortKey = Literal["marketplace_score", "cpc", "cookie_reach", "date_added", "name"]
SortDirection = Literal["asc", "desc"]


class DestinationDelivery(CamelModel):
    destination: DestinationId
    channel: Optional[str] = None          # "Advertiser Direct"
    usage: UsageLevel
    note: Optional[str] = None             # "direct audience-level reporting"
    live: bool


class Segment(CamelModel):
    id: str
    full_path: str
    path_prefix: str                       # everything up to the last ">"
    name: str                              # the leaf after the last ">"
    seller: str
    status: SegmentStatus
    marketplace_score: int                 # 0-100
    labels: List[PerformanceLabel]
    platform_count: int
    destinations: List[DestinationDelivery]  # ordered by usage, strongest first
    advertiser_direct_pct_of_media: int
    cpc: float
    cookie_reach: int
    date_added: str                        # "YYYY-MM-DD"
    category: str
    iab_category: Optional[str] = None


class UsagePoint(CamelModel):
    period: str                            # "Mar" or "2026-03"
    index: int                             # 0-100, indexed to the segment's own peak


class EarnedLabelExplanation(CamelModel):
    label: PerformanceLabel
    earned: bool
    explanation: str                       # supports **bold**


class EvidenceQuality(CamelModel):
    attribution_confidence: Literal["High", "Medium", "Low"]
    usage_directly_attributed_pct: int
    shared_ad_group_allocation_pct: int
    labels_last_recomputed: str            # "YYYY-MM-DD"
    reporting_window_start: str
    reporting_window_end: str


class SegmentPerformance(CamelModel):
    segment_id: str
    marketplace_score: int
    score_percentile_note: str             # "Top 5% in Retail · Wearables"
    advertisers_using_90d: str             # BAND, e.g. "30+", "15+", "8+", "<5"
    destination_count: int
    weeks_active: int
    weeks_in_window: int
    usage_index: List[UsagePoint]
    destinations: List[DestinationDelivery]
    earned_labels: List[EarnedLabelExplanation]   # all five labels, earned or not
    evidence: EvidenceQuality


class SegmentDetail(Segment):
    performance: SegmentPerformance


class FacetOption(CamelModel):
    value: str
    label: str
    count: int


class SegmentFacets(CamelModel):
    performance_labels: List[FacetOption]
    destinations: List[FacetOption]
    sellers: List[FacetOption]
    statuses: List[FacetOption]


class Paginated(CamelModel, Generic[T]):
    items: List[T]
    total: int
    total_unfiltered: int
    total_before_label_filters: Optional[int] = None
    page: int
    page_size: int


class AiRecommendation(CamelModel):
    rank: int                              # 1-based
    segment_id: str
    full_path: str
    marketplace_score: int
    labels: List[PerformanceLabel]
    platform_count: int
    extra_badge: Optional[str] = None
    meta: List[str]                        # pre-formatted chips, support **bold**
    why: str


class AskRequest(CamelModel):
    question: str


class AiDiscoveryResponse(CamelModel):
    id: str
    question: str
    lead: str
    recommendations: List[AiRecommendation]
    note: str
    candidate_segment_ids: List[str]
    total_candidates: int
```

Routes. Note `page_size` keeps its snake_case name on the wire, and
`/segments/facets` is declared before `/segments/{segment_id}`:

```python
router = APIRouter()


@router.get("/segments", response_model=Paginated[Segment], response_model_by_alias=True)
def list_segments(
    search: Optional[str] = None,
    labels: Optional[List[PerformanceLabel]] = Query(None),        # OR-ed
    destinations: Optional[List[DestinationId]] = Query(None),     # AND-ed, live only
    sellers: Optional[List[str]] = Query(None),
    statuses: Optional[List[SegmentStatus]] = Query(None),
    sort: SortKey = "marketplace_score",
    direction: SortDirection = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
) -> Paginated[Segment]:
    ...


# Must come before /segments/{segment_id}.
@router.get("/segments/facets", response_model=SegmentFacets, response_model_by_alias=True)
def get_facets() -> SegmentFacets:
    ...


@router.get("/segments/{segment_id}", response_model=SegmentDetail, response_model_by_alias=True)
def get_segment(segment_id: str) -> SegmentDetail:
    ...  # raise HTTPException(404, f"Segment {segment_id} not found")


@router.post("/discovery/ask", response_model=AiDiscoveryResponse, response_model_by_alias=True)
def ask_discovery(body: AskRequest) -> AiDiscoveryResponse:
    ...
```

`response_model_by_alias=True` is FastAPI's default, but it is spelled out here
because camelCase output depends on it.

---

## 11. Keeping the two sides in sync

Once the backend is running, regenerate the TypeScript types from its OpenAPI
schema instead of hand-editing `src/api/types.ts`:

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts
```

To point the UI at the backend:

```bash
# .env
VITE_API_MODE=live
VITE_API_BASE_URL=/api
VITE_FASTAPI_ORIGIN=http://localhost:8000
```

The yellow "mock data" banner at the top of the app disappears when live mode is
active — that is the quickest confirmation the switch worked.

---

## 9. Segment Intelligence API (tags) — a second service

Tags are **not** served by the backend documented above. They come from a
separate service on its own origin, configured with `VITE_TAGS_ORIGIN`
(default `http://localhost:8001`) and reached through the Vite dev proxy at
`VITE_TAGS_API_BASE_URL` (default `/tags-api/v1`). Client:
`src/api/tags.ts` — the only file that talks to it.

### Endpoints used

| Method | Path | Returns | Used by |
| --- | --- | --- | --- |
| `GET` | `/v1/tags` | `SegmentTagRow[]` | The tag vocabulary (11 tags today) |
| `GET` | `/v1/segments/{id}/tags` | `SegmentTagRow[]` | Chips under a segment name |
| `GET` | `/v1/tags/{slug}/segments` | `TagSegmentsPage` | The tag filter in **More Filters** |
| `GET` | `/v1/segments/{id}` | `SegmentIntelRow` | **Not implemented yet** — see below |

### `SegmentTagRow`

Snake_case, unlike the camelCase convention in §1 — this service follows its own.

| Field | Type | Notes |
| --- | --- | --- |
| `tag_key` | `string` | Stable slug, e.g. `top_facebook_activated` |
| `display_name` | `string` | Chip text, e.g. "Top Facebook Activated" |
| `description` | `string` | **Why** it was awarded, e.g. "Top 10% distributed on Facebook". Shown on hover. |
| `category` | `string` | `platform` \| `reach` \| `distribution`. Picks the chip tone; unknown values get the neutral tone. |
| `priority` | `number` | Lower sorts first. The table shows the two lowest and counts the rest. |

### Filtering by tag

The chips run id → tags; the **More Filters** tag facet runs the other way, on
`GET /v1/tags/{slug}/segments?page=&size=` (size max 200). It pages bare
`dms_segment_id` numbers and nothing else, so a whole tag is cheap even at the
top of the range — "Highly Distributed" is 111,480 ids, 558 requests, ~3s and
~1.3MB measured against the local service; most tags are a fraction of that.
Each tag's id set is cached for the tab, and selected tags are AND-ed by
intersecting their sets (`resolveTagFilter`) before the in-memory query runs.

The route's `total_items` counts against this service's ~198k rows, not the
~14.6k the app renders, so the facet deliberately shows **no count** next to a
tag rather than a number the result list would contradict.

### Why it is not the catalog source

Its `GET /v1/segments` carries **198,432** rows against the catalog API's
14,633, and takes only `page` and `size` (max 200) — no search, filter, sort or
field projection. The whole-catalog load in `src/api/liveCatalog.ts` would
become ~992 requests and ~830MB. It also drops `impressions`,
`gross_data_revenue`, `usage_platform_names`, `buyers_with_usage`,
`popularity_rank` and the usage window, which the metric columns, facets,
earned labels and the Performance tab are all built on, and has no counterpart
to `?query=` for AI Discovery.

So the catalog API stays the source of truth and this service enriches it, one
visible row at a time. `GET /v1/segments/{id}/tags` is 774 bytes and a few
milliseconds, so a 50-row page costs ~40KB and every id is cached for the tab.

### Wanted: `GET /v1/segments/{id}`

The service reports measured `cookie_reach`, `ios_reach`, `android_reach` and
`input_records` — figures `src/api/adapters/catalog.ts` currently *derives* from
delivered usage and flags as estimates. Adopting them needs a row-level fetch,
and there is none: `/v1/segments/1189` 404s, and the list route ignores `?ids=`
and `?fields=`.

The client is already written against that route and returns the tags *and* the
reach in a single response when it answers. Add it and set `VITE_TAGS_REACH=true`;
until then the flag is off, and turning it on early falls back to the tags route
on the 404 rather than breaking.
