# lr-bestsellers-ui

LiveRamp's Data Marketplace has close to a million syndicated segments. They are easy to *browse* and hard to *judge*. Two segments with the same name and similar cookie reach can behave completely differently once activated, and nothing in a normal catalogue table tells you which one advertisers actually keep buying.

**lr-bestsellers-ui** is the Connect UI for **Marketplace Performance Labels**: a segment browser where every row carries evidence of delivered marketplace usage — who reuses it, where it actually delivers, whether usage is climbing — plus an AI Discovery panel you can ask in English instead of filtering by hand.

You do **not** need a backend to run it. It ships with bundled fixtures, boots standalone with `npm run dev`, and switches to FastAPI by changing one environment variable.

---

## Why this is not "just a table with badges"

A catalogue table answers *what exists*. A buyer is asking *what works*. Those need different data and different filter semantics.

Performance labels are **OR-ed** — ticking *Top performer* and *Trending up* widens the result set, because the facet counts are independent and a buyer ticking two labels means "either is fine". Destinations are **AND-ed** — "proven on Facebook *and* Snapchat" is the actual activation question, and a destination only counts when it is genuinely delivering (`live: true`), not merely distributed.

That asymmetry is the product, not an implementation detail. The backend must mirror it exactly or the counts stop agreeing with the rows.

---

## High-level architecture

```mermaid
flowchart TD
    subgraph sources [Data Sources]
        Mock["src/api/mock/\n12 fixtures + in-memory engine"]
        FastAPI["FastAPI backend\n4 endpoints"]
    end

    subgraph layer [API Layer]
        Client["client.ts\nSegmentsApi interface"]
        Types["types.ts\nfrontend/backend contract"]
    end

    subgraph cache [Server State]
        RQ["TanStack Query\nstaleTime 60s"]
    end

    subgraph ui [UI]
        Segments["SegmentsPage\nfilters + table + discovery"]
        Detail["SegmentDetailPage\n5 tabs"]
    end

    subgraph state [Client State]
        URL["Query string\nevery filter + sort"]
    end

    Mock -->|"VITE_API_MODE=mock"| Client
    FastAPI -->|"VITE_API_MODE=live"| Client
    Types -.-> Client
    Client --> RQ
    RQ --> Segments
    RQ --> Detail
    URL <--> Segments
```

`src/api/client.ts` is the single switch point. Everything above it is unaware of which implementation is running:

```ts
export const api: SegmentsApi = API_MODE === 'live' ? liveApi : mockApi
```

---

## Request pipeline

```mermaid
flowchart LR
    Bar["FilterBar\nsearch debounced 300ms"] --> Hook["useSegmentQueryParams\nq, label, dest, seller, status, sort, dir"]
    Hook --> URLState["Browser query string\nshareable + back button"]
    URLState --> Q["SegmentQuery object"]
    Q --> Hooks["useSegments()\nqueryKey ['segments', q]"]
    Hooks --> API["api.listSegments()"]
    API --> HTTP["http.ts buildQueryString\nrepeated keys for lists"]
    HTTP --> Resp["Paginated[Segment]"]
    Resp --> Table["SegmentsTable\nmanualSorting: true"]
```

URL params are deliberately shorter than API params — `q` → `search`, `label` → `labels`, `dest` → `destinations`, `dir` → `direction`. Changing any filter drops `page`, so pagination resets.

---

## Filter semantics

```mermaid
flowchart TD
    S["Segment row"] --> Search{"search matches\nfullPath or seller?"}
    Search -->|No| Drop["Excluded"]
    Search -->|Yes| Labels{"labels selected?"}
    Labels -->|"None"| Dest
    Labels -->|"Yes — OR"| LabelGate{"has ANY\nselected label?"}
    LabelGate -->|No| Drop
    LabelGate -->|Yes| Dest{"destinations selected?"}
    Dest -->|"None"| Seller
    Dest -->|"Yes — AND"| DestGate{"delivers on EVERY\nselected destination\nwith live: true?"}
    DestGate -->|No| Drop
    DestGate -->|Yes| Seller{"seller + status\nexact match?"}
    Seller -->|No| Drop
    Seller -->|Yes| Keep["Included → sort → paginate"]
```

Reference implementation is `src/api/mock/index.ts`. Search also does a whitespace-stripped pass, so `"smart watch"` matches `"Smartwatch"`.

---

## Navigation and view state

```mermaid
stateDiagram-v2
    [*] --> segments: / redirects
    segments --> segments: filter, sort or search

    state segments {
        [*] --> browsing
        browsing --> discovery: Discover button or green rail
        discovery --> narrowed: POST /discovery/ask
        narrowed --> browsing: "back to all segments"
    }

    segments --> detail: click a row
    detail --> segments: back link

    state detail {
        [*] --> performance
        performance --> overview
        performance --> reach
        performance --> pricing
        performance --> destinations
    }
```

The detail page opens on **Marketplace performance**, not Overview — the performance evidence is the reason the page exists.

---

## Module layout

```mermaid
flowchart TB
    subgraph api [src/api]
        T["types.ts — the contract"]
        C["config.ts — env mode + base URL"]
        H["http.ts — fetch, ApiError, query building"]
        L["live.ts — FastAPI routes"]
        M["mock/ — fixtures, filter engine, facets"]
        CL["client.ts — mock vs live"]
        QR["queries.ts — TanStack Query hooks"]
    end
    subgraph lib [src/lib]
        LB["labels.ts — display metadata + formatters"]
        UQ["useSegmentQueryParams.ts — URL state"]
        MD["markdown.tsx — **bold** renderer"]
    end
    L --> CL
    M --> CL
    H --> L
    C --> H
    CL --> QR
    T -.-> L
    T -.-> M
```

Full component list:

```
components/
  AppLayout.tsx      Shell + mock-mode banner
  SideNav.tsx        Black LiveRamp nav, collapsible groups
  FilterBar.tsx      Search, Status, Sellers, More Filters, Discover
  FacetDropdown.tsx  Reusable multi-section facet popover
  FilterChips.tsx    Removable active-filter chips + sort control
  SegmentsTable.tsx  TanStack Table; full and compact variants
  DiscoveryPanel.tsx AI Segment Discovery conversation panel
  PerformanceTab.tsx Marketplace performance detail tab
  UsageSparkline.tsx ScoreBar.tsx DestinationDots.tsx Badge.tsx Checkbox.tsx
```

---

## Quick start

1. Requires Node **18+** (20 LTS recommended). Check with `node -v`; `nvm install 20` if older.
2. Install: `npm install`
3. Configure: `cp .env.example .env` — defaults run on mock data, nothing else to set.
4. Run: `npm run dev`
5. Open <http://localhost:5173>. A yellow banner confirms you are on mock data.

No Python, FastAPI or database is needed for steps 1–5.

### Troubleshooting: live mode loads but every field is empty

Almost always a **casing mismatch**. The UI expects camelCase JSON (`marketplaceScore`); Pydantic emits snake_case by default. Add an alias generator to your models:

```python
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
```

Other common ones:

```bash
# Changed .env but nothing happened — Vite reads env only at startup
# (and ignores any variable not prefixed VITE_)
npm run dev

# Blank page with a module resolution error
rm -rf node_modules package-lock.json && npm install

# Live mode returns 404s — check what FastAPI is actually serving
open http://localhost:8000/docs

# Anything odd — types catch it faster than the browser will
npm run typecheck
```

Styles missing? Tailwind only scans `./index.html` and `./src/**/*.{ts,tsx}` — a component outside `src/` gets no styles.

---

## Environment reference

| Variable | Read by | Meaning |
|---|---|---|
| `VITE_API_MODE` | `config.ts` → `API_MODE` | `mock` (default) or `live` |
| `VITE_API_BASE_URL` | `config.ts` → `API_BASE_URL` | Prefix for every request; default `/api` |
| `VITE_FASTAPI_ORIGIN` | `vite.config.ts` | Dev-proxy target; default `http://localhost:8000` |
| `VITE_MOCK_LATENCY_MS` | `config.ts` → `MOCK_LATENCY_MS` | Simulated network delay, default `250` |

Vite reads `.env` once at **startup** — restart the dev server after any change. Variables without a `VITE_` prefix are ignored.

---

## Switching to the FastAPI backend

```bash
# .env
VITE_API_MODE=live
VITE_API_BASE_URL=/api
VITE_FASTAPI_ORIGIN=http://localhost:8000
```

`vite.config.ts` proxies `/api` to `VITE_FASTAPI_ORIGIN`, so **CORS does not need configuring** in development. To call FastAPI directly instead, set `VITE_API_BASE_URL=http://localhost:8000` and add `CORSMiddleware`.

| Method | Path | Returns |
|---|---|---|
| `GET` | `/segments` | `Paginated[Segment]` |
| `GET` | `/segments/facets` | `SegmentFacets` |
| `GET` | `/segments/{id}` | `SegmentDetail` |
| `POST` | `/discovery/ask` | `AiDiscoveryResponse` |

**[BACKEND_API.md](./BACKEND_API.md) is the full specification** — every query parameter, field-level response tables, error and auth behaviour, and paste-ready Pydantic models. `src/api/live.ts` is the only file that knows route paths; edit it there if yours differ.

Keep types in sync automatically once the backend is up:

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts
```

---

## Interaction examples

| What you do | What happens | Where |
|---|---|---|
| Type `smart watch` | Debounced 300 ms, matches path and seller, whitespace-insensitive | `FilterBar.tsx` |
| Tick *Top performer* + *Trending up* | Results **widen** (OR) | `mock/index.ts` |
| Tick *Facebook* + *Snapchat* | Results **narrow** to segments live on both (AND) | `mock/index.ts` |
| Click a column header | Server-side re-sort; clicking the active column flips direction | `SegmentsTable.tsx` |
| Copy the URL after filtering | Filters and sort travel with the link; back button works | `useSegmentQueryParams.ts` |
| Ask the Discovery panel a question | Left table narrows to the AI's candidate set | `DiscoveryPanel.tsx` |
| Click any row | Detail page, opening on Marketplace performance | `SegmentDetailPage.tsx` |

Consuming the API from a component:

```tsx
import { useSegments, useFacets } from '@/api/queries'

const { data: facets } = useFacets()                         // cached 5 min
const { data } = useSegments({ labels: ['top_performer'], sort: 'cpc' })

data?.items.map((s) => s.name)
```

Calling it directly, outside React:

```ts
import { api } from '@/api/client'

const page = await api.listSegments({ search: 'wearables', page: 1, pageSize: 25 })
const detail = await api.getSegment('4481902')
```

---

## Development commands

```bash
npm install
npm run dev          # hot reload on :5173
npm run typecheck    # tsc --noEmit; silence means success
npm run build        # typecheck, then build to dist/
npm run preview      # serve the built dist/ locally
```

---

## Backend contract (short)

- **camelCase** response bodies; `page_size` is the only snake_case query param
- **Repeated query keys** for list filters (`?labels=a&labels=b`), never CSV
- **Labels OR-ed, destinations AND-ed**, and destinations only count when `live: true`
- **Facet counts are catalogue-wide**, not scoped to the current result set
- **Dates are bare `YYYY-MM-DD`** — timestamps break date formatting
- `**bold**` is the **only markup** the UI parses in backend-authored prose
- Declare `/segments/facets` **before** `/segments/{id}` or `facets` is read as an id

---

## Known gaps

- Pagination is computed but no pager control is rendered (fixtures fit one page)
- Reach and Pricing tabs show the fields we have; **Est. CPM is `cpc * 8.4`**, a hardcoded frontend multiplier with no backend origin
- Discovery responses are canned in mock mode; if the backend streams, swap `apiFetch` for a `StreamingResponse` reader in `live.ts`
- No auth anywhere — `src/api/http.ts` is the single place to add a token or tenant header
- Row selection is client-only; nothing is posted. "Download Full Catalog" is inert
- No tests yet

---

## Docs and status

| Document | Covers |
|---|---|
| **README.md** (this file) | Architecture, setup, contract summary |
| **[BACKEND_API.md](./BACKEND_API.md)** | Full API spec for the backend team |
| **[READ.md](./READ.md)** | Long-form install walkthrough and troubleshooting |
| **[PLAN.md](./PLAN.md)** | What was built, why, and what's left |

Internal LiveRamp tooling. Node **18+**, Vite **8**, React **18**, TypeScript **5.7**.
