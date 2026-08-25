# LR_BESTSELLERS_UI — Build Plan & Record

Marketplace Performance Labels UI for LiveRamp Connect: a segment browser with
earned performance labels, an AI discovery panel, and a per-segment performance
detail view.

This document records what was built, why each choice was made, and what remains.
It is written to be handed to someone who hasn't seen the project before.

- **Status:** skeleton complete, all four screens interactive on mock data
- **Source of truth for the UI:** `connect-ui-mockups.html` (three static mockups)
- **Backend:** FastAPI, not yet wired — the client layer is built and waiting

---

## 1. Objective

Turn three static HTML mockups into a working React application that:

1. Reproduces the mockups closely enough to demo and to iterate on with design.
2. Is genuinely interactive — real filtering, sorting, selection, navigation —
   not a clickable prototype.
3. Reads from mock data today and from FastAPI tomorrow, with a one-line switch
   and no component changes in between.

That third point drove most of the architecture. The riskiest outcome for a
skeleton like this is that swapping in the real backend means rewriting the
components, so the mock/live boundary was designed first.

---

## 2. Requirements captured

Confirmed with the user before any code was written:

| Question | Decision |
| --- | --- |
| Data source | Mock data now, **plus** a real FastAPI client behind the same interface |
| Frontend stack | Vite + React 18 + TypeScript + Tailwind |
| Scope | All four screens: list, filter panel, AI discovery, detail page |
| Location | `/Users/mvenka/code/LR_BESTSELLERS_UI` |

---

## 3. Stack decisions

| Choice | Why | Alternative rejected |
| --- | --- | --- |
| **Vite** | Fast dev loop; this is a client-side app behind an existing auth shell, so SSR buys nothing | Next.js — routing conventions and SSR are overhead here |
| **TypeScript** | The FastAPI contract is the highest-risk seam; types make mismatches visible at compile time | Plain JS |
| **Tailwind** | The mockups are heavily custom-styled; utility classes port that faster than fighting a component kit's defaults | CSS Modules — more files, no real gain |
| **TanStack Query** | Caching, loading/error states, request dedup for free; `placeholderData` keeps the table stable while refetching | Manual `useEffect` + `fetch` — reinvents the same logic worse |
| **TanStack Table** | Headless, so the mockup's exact styling survives; handles sorting and selection plumbing | AG Grid / MUI DataTable — opinionated styling would have to be overridden everywhere |
| **Radix UI** | Accessible popover, tabs, focus management out of the box, unstyled | Hand-rolled dropdowns — a11y bugs and focus traps |
| **URL as filter state** | Filtered views become shareable and the back button works | `useState` — state lost on refresh, nothing to paste into Slack |

---

## 4. What was built

### Phase 1 — Scaffold

Vite/TypeScript/Tailwind/PostCSS config, `index.html`, entry point,
`.env.example`, `.gitignore`.

The mockup's CSS custom properties were lifted into `tailwind.config.js` as
named colors (`indigo`, `green-deep`, `amber-soft`, `violet-ink`, …) so the
palette has one home. The repeating badge and field patterns became `@layer
components` classes in `src/index.css` rather than being retyped at each call
site.

> One consequence worth knowing: extending `colors` overrides Tailwind's stock
> `green`, `indigo`, `blue`, `teal`, `violet` and `amber` palettes. `bg-blue-500`
> no longer resolves. `red` is untouched and is what error states use.

### Phase 2 — API and mock layer

The core of the design. Five files:

```
src/api/
  types.ts     Domain types — the frontend/backend contract
  config.ts    Reads VITE_API_MODE / VITE_API_BASE_URL
  http.ts      fetch wrapper: ApiError, FastAPI-style repeated query params
  live.ts      FastAPI client — the ONLY file that knows route paths
  client.ts    Picks mock or live at startup
  queries.ts   TanStack Query hooks — all components use these
  mock/        Fixtures + in-memory filter/sort/paginate
```

`client.ts` is a single line of consequence:

```ts
export const api: SegmentsApi = API_MODE === 'live' ? liveApi : mockApi
```

Both implementations satisfy the same `SegmentsApi` interface, so components
never learn which one they're talking to. Switching modes is an env var.

The mock layer does real work rather than returning canned arrays — it filters,
sorts and paginates in memory using the same semantics the backend must
implement. That surfaces filter-logic disagreements now, while they're cheap.

Twelve fixture segments were authored covering every label combination,
destination mix and score band, including deliberately unlabelled and
low-scoring rows so empty and weak states are visible during development.

`mockPerformanceFor()` derives a plausible performance payload for any segment,
so **every** row opens a working detail page — not just the one segment the
mockup detailed.

### Phase 3 — Shell and routing

`SideNav` (black LiveRamp nav with collapsible groups), `AppLayout`, and React
Router routes for `/segments` and `/segments/:id`.

`AppLayout` renders a yellow banner whenever mock mode is active. Small, but it
prevents the failure mode where someone demos mock numbers believing they're
real.

### Phase 4 — List page

`FilterBar`, `FacetDropdown`, `FilterChips`, `SegmentsTable`, `SegmentsPage`,
plus `useSegmentQueryParams`.

- Search is debounced 300 ms so typing doesn't fire a request per keystroke.
- `FacetDropdown` is generic over sections, so Status, Sellers and More Filters
  are one component configured three ways.
- The table has full and compact variants; compact is what renders beside the
  open AI panel.
- Every filter and sort value is serialised into the query string by
  `useSegmentQueryParams`, which is the single source of truth for list state.

### Phase 5 — AI Discovery panel

`DiscoveryPanel` — conversation view, ranked result cards linking to detail
pages, "why these three" explanation block, follow-up input, skeleton loading
state, and suggested prompts for the empty state.

When a question is answered, the left table narrows to the AI's candidate set
with a "Show all segments" escape hatch.

### Phase 6 — Detail page

`SegmentDetailPage` with five Radix tabs, `PerformanceTab`, `UsageSparkline`.

The performance tab carries the trust-building content from the mockup: KPI
cards, a six-month usage sparkline, where-it-delivers rows, per-label earned /
**not earned** explanations with thresholds, and evidence-quality figures.

The not-earned rows matter. Showing *why* a segment missed a label — "usage grew
11%, below the +40% threshold" — is what makes the labels credible rather than
arbitrary.

### Phase 7 — Verification

`npm install` was not possible (the build sandbox has no registry access), so
verification was a two-pass static review against the strict tsconfig flags.

**First pass found:**

- 4 × TS2686 — `React.ReactNode` referenced in modules that never import React.
  Under `jsx: "react-jsx"` there is no automatic React binding. Fixed with
  `import type { ReactNode }`.
- "Clear all" in the More Filters popover wiped search, sellers and sort too.
  Scoped it to the filters that popover owns; moved a genuine clear-everything
  action to the chips row where its blast radius is visible.
- Multi-select labels were AND-ed, contradicting the independent per-label facet
  counts. Changed to OR. **Destinations stay AND-ed** — see §6.
- `?page=abc` produced `NaN`, silently emptying the table.
- The AI results header could read "3 of 26" while the footer said "of 26
  Selected" against 3 visible rows.
- Every non-trending segment got a *declining* sparkline, including top
  performers — a top performer that looks like it's dying undermines the label.
- The discovery panel parsed a platform count out of a display string that never
  contained one. Added `platformCount` to the type instead.

**Second pass confirmed** all fixes landed with no regressions, and separately
verified imports/exports, Tailwind class resolution, React Router v6, TanStack
Query v5 / Table v8, and Radix usage.

> **Caveat, stated plainly:** this is a static review, not a compiled build.
> Run `npm run typecheck` locally before trusting it.

---

## 5. Final structure

```
LR_BESTSELLERS_UI/
├── READ.md                    Getting started — install and run
├── README.md                  Architecture and backend contract
├── PLAN.md                    This document
├── package.json  tsconfig.json  vite.config.ts
├── tailwind.config.js  postcss.config.js  index.html  .env.example
└── src/
    ├── main.tsx  router.tsx  index.css
    ├── api/
    │   ├── types.ts       Contract types
    │   ├── config.ts      Env-driven mode + base URL
    │   ├── http.ts        fetch wrapper, ApiError
    │   ├── live.ts        FastAPI client
    │   ├── client.ts      Mock/live switch
    │   ├── queries.ts     TanStack Query hooks
    │   └── mock/          segments.ts, facets.ts, index.ts
    ├── components/
    │   ├── AppLayout.tsx      Shell + mock-mode banner
    │   ├── SideNav.tsx        Collapsible LiveRamp nav
    │   ├── FilterBar.tsx      Search, Status, Sellers, More Filters
    │   ├── FacetDropdown.tsx  Reusable multi-section facet popover
    │   ├── FilterChips.tsx    Active-filter chips + sort control
    │   ├── SegmentsTable.tsx  TanStack Table, full + compact
    │   ├── DiscoveryPanel.tsx AI conversation panel
    │   ├── PerformanceTab.tsx Marketplace performance tab
    │   └── UsageSparkline · ScoreBar · DestinationDots · Badge · Checkbox
    ├── lib/
    │   ├── labels.ts                Label metadata + formatters
    │   ├── useSegmentQueryParams.ts URL-synced filter state
    │   ├── markdown.tsx             Minimal **bold** renderer
    │   └── cn.ts
    ├── pages/  SegmentsPage.tsx · SegmentDetailPage.tsx
    └── types/  table.d.ts           TanStack ColumnMeta augmentation
```

---

## 6. Decisions the backend must match

These are the places where frontend and backend can silently disagree. Worth a
conversation before the FastAPI work starts.

**Performance labels are OR-ed.** Selecting *Top performer* and *Trending up*
widens the result set. The facet counts are independent per-label totals, so
OR is what the UI implies.

**Destinations are AND-ed.** "Proven on Facebook **and** Snapchat" is the
activation question buyers are actually asking, and the mockup's own copy —
"only shows segments with delivered impressions on the platforms you select" —
says so. Asymmetric with labels, deliberately.

**camelCase on the wire.** Pydantic emits snake_case by default. Add an alias
generator (`alias_generator=to_camel`, `populate_by_name=True`) or the UI will
render blank fields with no error.

**Repeated query keys for lists.** `?label=top_performer&label=trending_up`,
matching FastAPI's `Query(List[str])`.

**Facet counts are catalogue-wide,** not counts within the current result set.
The mock returns fixed numbers to make this explicit.

---

## 7. What's next

**Before the backend lands**

- [ ] Run `npm install && npm run typecheck` and fix anything the static review
      missed
- [ ] Design review of the four screens against the mockups
- [ ] Confirm the OR/AND filter semantics in §6 with product

**Wiring up FastAPI**

- [ ] Implement the four endpoints; confirm paths against `src/api/live.ts`
- [ ] Add camelCase alias generation to the Pydantic models
- [ ] Generate types from OpenAPI:
      `npx openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts`
- [ ] Switch `VITE_API_MODE=live` and walk through §5 of `READ.md`

**Feature gaps**

- [ ] Pagination control — the plumbing exists, the pager UI doesn't (fixtures
      fit one page)
- [ ] Reach and Pricing tabs show only the fields we have today
- [ ] Request/licensing flow for selected segments — the footer counts them but
      nothing acts on them
- [ ] Streaming AI responses — if FastAPI uses `StreamingResponse`, swap
      `apiFetch` for a `ReadableStream` reader in `live.ts`
- [ ] Seller-side view of distributed-but-not-delivering segments (referenced in
      the mockup's footnote)

**Engineering**

- [ ] ESLint + Prettier — referenced in early drafts, not yet configured
- [ ] Tests: Vitest for `filterSegments` and `useSegmentQueryParams`, React
      Testing Library for the filter interactions
- [ ] Error boundary around the routes
- [ ] Load Carlito or Inter — `tailwind.config.js` asks for them but no webfont
      is loaded, so everything falls back to `system-ui`
- [ ] Empty, loading and error states reviewed with design
