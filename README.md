# LR_BESTSELLERS_UI

Connect UI for **Marketplace Performance Labels** — the Data Marketplace segment
browser, AI Segment Discovery panel, and segment performance detail page.

Vite + React 18 + TypeScript + Tailwind, with TanStack Query/Table and Radix
primitives. Runs against bundled mock fixtures by default and switches to a
FastAPI backend with one environment variable.

## Documentation

- **[READ.md](./READ.md)** — install, run locally, troubleshooting. Start here.
- **README.md** (this file) — architecture and backend contract summary.
- **[BACKEND_API.md](./BACKEND_API.md)** — the full API spec for the backend team:
  every endpoint, query parameter and response field, plus Pydantic stubs.
- **[PLAN.md](./PLAN.md)** — what was built, why, and what's left.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Other scripts: `npm run build`, `npm run typecheck`, `npm run preview`.
Full setup notes and troubleshooting are in [READ.md](./READ.md).

## Switching from mock data to FastAPI

Everything routes through `src/api/client.ts`, which picks an implementation at
startup:

| `VITE_API_MODE` | Implementation | File |
| --- | --- | --- |
| `mock` (default) | In-memory fixtures with simulated latency | `src/api/mock/` |
| `live` | `fetch` against FastAPI | `src/api/live.ts` |

```bash
# .env
VITE_API_MODE=live
VITE_API_BASE_URL=/api            # proxied to FastAPI by Vite in dev
VITE_FASTAPI_ORIGIN=http://localhost:8000
```

`vite.config.ts` proxies `/api` to `VITE_FASTAPI_ORIGIN`, so you don't need CORS
configured on the backend during development. To call FastAPI directly instead,
set `VITE_API_BASE_URL=http://localhost:8000` and add `CORSMiddleware` on the
backend.

A yellow banner appears at the top of the app whenever mock mode is active, so
you always know which source you're looking at.

## Backend contract

**[BACKEND_API.md](./BACKEND_API.md) is the full specification** — field-level
tables for every response, filter semantics, error and auth behaviour, and
paste-ready Pydantic models. The summary below is the shape of it.

`src/api/types.ts` is the contract in code. `src/api/live.ts` is the only file
that knows about routes and query-parameter names — adjust it if your routes
differ.

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/segments` | `Paginated[Segment]` |
| `GET` | `/segments/facets` | `SegmentFacets` |
| `GET` | `/segments/{id}` | `SegmentDetail` |
| `POST` | `/discovery/ask` | `AiDiscoveryResponse` |

`GET /segments` query params: `search`, `labels` (repeated), `destinations`
(repeated), `sellers` (repeated), `statuses` (repeated), `sort`, `direction`,
`page`, `page_size`. Repeated keys map to FastAPI `Query(List[str])` params.

Field names are camelCase on the wire. If your Pydantic models are snake_case,
add an alias generator so responses match:

```python
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
```

To keep types in sync automatically once the backend is up:

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts
```

## Project structure

```
src/
  api/
    types.ts        Domain types — the frontend/backend contract
    config.ts       Env-driven mode and base URL
    http.ts         fetch wrapper, ApiError, FastAPI-style query building
    live.ts         FastAPI client
    client.ts       Chooses mock vs live
    queries.ts      TanStack Query hooks
    mock/           Fixtures + in-memory filtering, sorting, pagination
  components/
    AppLayout.tsx   Shell + mock-mode banner
    SideNav.tsx     Black LiveRamp nav, collapsible groups
    FilterBar.tsx   Search, Status, Sellers, More Filters, Discover
    FacetDropdown.tsx  Reusable multi-section facet popover
    FilterChips.tsx    Removable active-filter chips + sort control
    SegmentsTable.tsx  TanStack Table; full and compact variants
    DiscoveryPanel.tsx AI Segment Discovery conversation panel
    PerformanceTab.tsx Marketplace performance detail tab
    UsageSparkline.tsx, ScoreBar.tsx, DestinationDots.tsx, Badge.tsx, Checkbox.tsx
  lib/
    labels.ts       Label/destination metadata, formatters
    useSegmentQueryParams.ts  URL-synced filter + sort state
    markdown.tsx    Minimal **bold** renderer for backend copy
  pages/
    SegmentsPage.tsx        List + filters + discovery
    SegmentDetailPage.tsx   Tabbed detail view
```

## What's interactive today

- **Search** — debounced, matches segment path and seller.
- **Status / Sellers / More Filters** — facet popovers with counts. Performance
  labels are OR-ed (selecting two widens results, matching the per-label counts);
  destinations are AND-ed, since "proven on Facebook *and* Snapchat" is the
  activation question buyers are asking. The backend must mirror this.
- **Filter chips** — click to remove, plus Clear all; sort dropdown and direction
  toggle.
- **Table** — click column headers to sort, checkbox row and select-all,
  click a row to open its detail page.
- **URL state** — every filter and sort lives in the query string, so views are
  shareable and the back button works.
- **Discovery panel** — opens from the green rail or the Discover button; asking
  a question narrows the left table to the AI's candidate set, with a link back
  to all segments.
- **Detail page** — five Radix tabs, KPI cards, usage sparkline, earned/not-earned
  label explanations, and evidence-quality rows.

## Known gaps

- Pagination is computed but no pager control is rendered yet (fixtures fit one
  page).
- Reach and Pricing tabs show the fields we have; deeper breakdowns need backend
  endpoints.
- Discovery responses are canned in mock mode; `POST /discovery/ask` is wired for
  live mode. If the backend streams, swap `apiFetch` for a `StreamingResponse`
  reader in `live.ts`.
- No tests yet.
