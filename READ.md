# Getting Started

Everything you need to run **LR_BESTSELLERS_UI** on your machine.

For the architecture, backend contract and design decisions, see
[`README.md`](./README.md) and [`PLAN.md`](./PLAN.md).

---

## 1. Prerequisites

| Tool | Version | Check with |
| --- | --- | --- |
| Node.js | 18.x or newer (20 LTS recommended) | `node -v` |
| npm | 9 or newer (ships with Node) | `npm -v` |

Vite 5 requires Node 18+. If `node -v` shows 16 or lower, install a newer
version first — [nvm](https://github.com/nvm-sh/nvm) is the easiest route:

```bash
nvm install 20
nvm use 20
```

You do **not** need Python, FastAPI, or a database to run the UI. It ships with
mock data and runs standalone.

---

## 2. Install

```bash
cd /Users/mvenka/code/LR_BESTSELLERS_UI
npm install
```

This pulls down React, Vite, Tailwind, TanStack Query/Table and Radix UI. First
install takes a minute or two.

---

## 3. Configure

```bash
cp .env.example .env
```

The defaults run against bundled mock data, so you can skip straight to step 4.
The file looks like this:

```bash
VITE_API_MODE=mock                        # "mock" or "live"
VITE_API_BASE_URL=/api                    # used when mode is "live"
VITE_FASTAPI_ORIGIN=http://localhost:8000 # where the dev proxy forwards /api
VITE_MOCK_LATENCY_MS=250                  # fake network delay in mock mode
```

Vite only reads `.env` at **startup** — restart the dev server after any change.

---

## 4. Run

```bash
npm run dev
```

Open <http://localhost:5173>. You should land on the Data Marketplace Segments
list, with a yellow banner across the top confirming you're on mock data.

If port 5173 is taken, Vite picks the next free port and prints it — read the
terminal output rather than assuming the URL.

---

## 5. Try it out

A quick tour to confirm everything works:

1. Type `smart watch` in the search box — the table filters as you type.
2. Open **More Filters**, tick *Top performer* and *Facebook*, hit **Apply
   filters**. Chips appear below the toolbar; click a chip to remove it.
3. Click the **Marketplace Score** column header to flip the sort direction.
4. Tick a few row checkboxes — the footer count updates.
5. Click the green **Ask the Data Marketplace** rail on the right (or the
   **Discover** button) and pick one of the suggested questions.
6. Click any table row to open the segment detail page, then switch to the
   **Marketplace performance** tab.
7. Copy the URL after filtering and paste it into a new tab — filters and sort
   are preserved, because they live in the query string.

---

## 6. Available commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on port 5173 |
| `npm run typecheck` | Runs `tsc --noEmit` — no output means no type errors |
| `npm run build` | Typechecks, then builds to `dist/` |
| `npm run preview` | Serves the built `dist/` locally |

Run `npm run typecheck` first if something behaves oddly — it catches most
problems faster than the browser will.

---

## 7. Pointing at your FastAPI backend

Once your backend is up:

```bash
# .env
VITE_API_MODE=live
VITE_API_BASE_URL=/api
VITE_FASTAPI_ORIGIN=http://localhost:8000
```

Restart `npm run dev`. The yellow mock banner disappears, which is your
confirmation the switch took effect.

Vite proxies `/api` to `VITE_FASTAPI_ORIGIN`, so **you don't need CORS
configured** during development. To bypass the proxy and call FastAPI directly,
set `VITE_API_BASE_URL=http://localhost:8000` and add `CORSMiddleware` on the
backend.

The UI expects four endpoints:

| Method | Path |
| --- | --- |
| `GET` | `/segments` |
| `GET` | `/segments/facets` |
| `GET` | `/segments/{id}` |
| `POST` | `/discovery/ask` |

Response shapes are defined in `src/api/types.ts`. Routes and query-parameter
names live in `src/api/live.ts` — that's the only file to edit if your paths
differ. Full contract details are in `README.md`.

---

## 8. Troubleshooting

**`npm install` fails with EACCES or permission errors**
Don't use `sudo`. Fix npm's directory permissions or switch to nvm-managed Node.

**Blank white page, console shows a module resolution error**
Delete and reinstall: `rm -rf node_modules package-lock.json && npm install`.

**Styles look unstyled or broken**
Tailwind scans `./index.html` and `./src/**/*.{ts,tsx}` only. A component placed
outside `src/` won't get styles. Restart the dev server after editing
`tailwind.config.js`.

**Changed `.env` but nothing happened**
Restart the dev server. Vite reads env vars once at startup. Also confirm the
variable name starts with `VITE_` — Vite ignores any that don't.

**Live mode returns 404s**
Check `VITE_FASTAPI_ORIGIN` matches where FastAPI is actually listening, and
that your routes match the table in section 7. Visit
`http://localhost:8000/docs` to see what FastAPI is actually serving.

**Live mode loads but fields are empty**
Almost always a casing mismatch. The UI expects camelCase JSON
(`marketplaceScore`); Pydantic emits snake_case by default. Add an alias
generator to your models — see the Backend contract section of `README.md`.

**Type errors after pulling changes**
`npm install` again — a dependency may have been added.
