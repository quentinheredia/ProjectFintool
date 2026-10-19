# Architecture

What the application is, how a request becomes a story, and where state lives.
This is a description of what runs today, not a plan.

[SYSTEM.md](SYSTEM.md) is what may change and what nobody is allowed to do.
[DESIGN.md](DESIGN.md) is what a person sees. [GITHUB.md](GITHUB.md) is how a
change reaches `master`.

---

## One app, six routes

```
next start (Next 15, App Router)
 ├── /                         landing (opening animation, one CTA), or a shared deck
 ├── /tour                     the seven-card deck on a sample input, ending at the sandbox
 ├── /sandbox                  live comparison; every control recomputes in the browser
 ├── /industries               one job then vs now, through the industries API
 ├── /api/industries           GET: the occupation list and each one's data status
 ├── /api/industries/compare   GET ?occupation=&then=: one occupation comparison as JSON
 └── /api/og/card              Edge route handler: one card as a PNG
```

The flow: `/` -> `See the comparison` -> `/tour` -> last card `Compare with
your numbers` -> `/sandbox` -> `Play your story` (the deck at `/?...`) or
`/industries`.

No custom server, no WebSocket, no session. Everything a page needs is in its
URL, so any instance can answer any request and a deploy is `next build` and
`next start` on any Node host, or Vercel as is.

---

## Where state lives

There is no user state. **The URL is the result**: `/?by=1996&inc=65000` is the
whole input, and the same URL always produces the same seven cards. That is what
makes a shared link, a refresh and a link unfurl agree with each other.

What is stored is the data the cards are computed from, and the queries people
ran.

### 1. Yearly metrics - in the bundle, optionally in Postgres

62 rows, 1965-2026, 14 figures each plus `isEstimate`.

| | |
|---|---|
| `src/data/historical-seed.ts` | Generated TypeScript. In every bundle, server and Edge |
| `yearly_metrics` | The same rows in Postgres, when `DATABASE_URL` is set and `db:seed` has run |

`getMetricsTable()` (`src/db/index.ts`) decides per request:

```
DATABASE_URL unset                       -> seed
SELECT * FROM yearly_metrics fails        -> seed, and a warning in the log
fewer than 62 rows                        -> seed (a half-seeded table is not used)
otherwise                                 -> Postgres, numeric strings -> numbers
```

There is no mix: a story is computed from one table or the other, never both.
The OG route skips the question and always reads the seed (see below).

### 2. Anonymous queries - Postgres only

`anonymous_queries` gets one row per deck rendered: birth year, the benchmark
peer's age, income. No IP, no cookie, no user agent.

```
Home (valid query)
 ├── compareGenerations(...)              the story
 ├── after(() => logAnonymousQuery(row))  registered, not awaited
 └── return <StoryCarousel/>              the response goes out
                                          ... then the insert runs
```

`after()` runs the insert once the response is sent, so the story is never
slower for being counted. Without `DATABASE_URL` it does nothing; a failed
insert is a log line. Measured with an unreachable database: the page answered
200 in 0.06-0.16s and both failures appeared only in the log.

---

## The data pipeline

`npm run data:build` runs `scripts/build-historical-seed.ts`, which fetches
FRED's public CSV endpoint (`fredgraph.csv?id=`), no key needed, and writes the
seed. The methodology comment at the top of the script is the citation; this is
the summary.

| Column | Source | How |
|---|---|---|
| `medianIncome` | BLS `LEU0252881500A`, median weekly earnings, full-time | x 52. Backcast before 1979 and projected for the current year with AHETPI |
| `avgHourlyWage` | BLS `AHETPI` | Annual mean of monthly |
| `cpiIndex` | BLS `CPIAUCSL` | Annual mean of monthly |
| `federalMinWage` | DOL `FEDMINNFRWG` | The statutory rate **at year end**, not a blended mean ($4.75, not $4.38, for 1996) |
| `medianHomePrice` | Census/HUD `MSPUS` | Annual mean of quarterly |
| `mortgageRate30Yr` | Freddie Mac `MORTGAGE30US` | Annual mean of weekly; 1965-1971 from FHLBB contract rates |
| `milkGallonPrice` | BLS `APU0000709112`, spliced to `APU0000709111` (half gallon) | Scaled at the overlap year; 1965-1979 from BLS retail food price anchors |
| `eggsDozenPrice` | BLS `APU0000708111` | 1965-1979 from anchors |
| `groundBeefLbPrice` | BLS `APU0000703111` | 1965-1979 from anchors |
| `avgUsedCarPrice`, `averageNewCar` | NADA / Manheim / Edmunds / KBB anchors | **Modeled**, log-linear between anchors |
| `averageTuition` | NCES Digest Table 330.10 anchors | **Modeled** |
| `medianLandAcrePrice` | Lincoln Institute / FHFA / NAHB anchors | **Modeled**, the least certain column |
| `avgRetirementAge` | Boston College CRR / OECD anchors | **Modeled** |

Rules the script applies:

- A series' first year is dropped if it starts mid-year; a partial first year is
  not an annual average.
- The current year is a year-to-date average and is the only row with
  `isEstimate: true`.
- Pre-1980 grocery prices are **not** backcast with the food CPI. That was tried:
  it gave 1965 milk at $0.57 against a historical ~$0.95, understating the past
  and biasing every card toward "harder today".

---

## The engine

`src/lib/comparator-engine.ts`. Pure TypeScript: an input and a table in, a
`ComparisonResult` out.

```
compareGenerations(input, table)
 ├── resolveBenchmark(input)      the year, clamped to 1965-2025
 ├── the six detail cards         each with a burden ratio and a verdict
 ├── the summary card             built from the six
 └── charts                       labor receipt, divergence series
```

### Benchmark year

Every mode is anchored on the parent's birth year: `parentBirthYear` when it is
given, otherwise `birthYear - DEFAULT_PARENT_AGE_GAP` (30).

| Mode | Year | For birth year 1990, parent unknown |
|---|---|---|
| `parent_peer` | `parentBirthYear + (CURRENT_YEAR - birthYear)` | 1996 - your parent at your age |
| `age_25` | `parentBirthYear + 25` | 1985 - your parent at 25 |
| `age_30` | `parentBirthYear + 30` | 1990 - your parent at 30 |
| `custom` | `customBenchmarkYear` | as given |

### Work status

| `employment` | Income used | Time |
|---|---|---|
| `working` (default) | `income` | counted from today |
| `student` | `income`, the expected one | `workStartYear - CURRENT_YEAR` years are added to the time to the keys (card 2) |
| `not_working` | full-time federal minimum wage, from the current year's data | counted from today |

`meta.income` is always the income every card used.

Every mode is clamped to 1965-2025 (the current year cannot benchmark against
itself). `meta.clampedYear` is the year used when clamping happened, otherwise
`null`, and the deck prints it.

### Verdict

Each card reports a **burden ratio**: effort now divided by effort then, in that
card's own unit (years saved, minutes worked, hours of labour, inverse real
buying power). `verdictFor` maps it once, for every card:

| Ratio | Direction | Aura |
|---|---|---|
| > 1.25 | harder | crimson |
| > 1 | harder | amber |
| <= 1 | easier | emerald |

The summary's `overallBurdenIndex` is the geometric mean of the **user-specific**
ratios, cards 1-4. Cards 5 and 6 describe minimum-wage workers and retirees in
general, so they are on the summary card but not in its verdict.

### Validation

`comparatorInputSchema` (`src/lib/comparator-input.ts`) coerces query strings,
checks ranges, and gives each failure a sentence a person can act on ("Birth
year must be 1945 or later"). It is a separate module from the engine so that
client components can import the engine without bundling zod; the engine's
`ComparatorInput` interface is the contract and the schema `satisfies` it.

---

## The request path

### `/`

```
GET /?by=1996&inc=65000&mode=parent_peer
 └── Home (server)
      ├── parseComparisonQuery(searchParams)
      │    ├── empty   -> <Landing/>
      │    ├── invalid -> redirect /sandbox?<same query>       the sandbox cannot hold an invalid input
      │    └── valid   -> input
      ├── getMetricsTable()
      ├── compareGenerations(input, table)
      ├── buildStorySlides(result)                           the words for each card
      ├── after(logAnonymousQuery)
      └── <StoryCarousel result slides finale/>               client; finale opens the sandbox
```

`generateMetadata` reads the same query and points `og:image` at card 7 in the
social format, so a shared link unfurls as the summary. It needs
`NEXT_PUBLIC_SITE_URL` to build an absolute URL.

### `/sandbox`

The server parses the same query keys and passes the initial input, every year
of metrics and the wage presets to `Sandbox` (client). Each control change runs
`compareGenerations` in the browser, so results update without a request, and
`history.replaceState` keeps the address bar on `/sandbox?<share keys>`. Every
control is a choice that cannot be invalid except the income text; while that is
out of range, the results keep the last valid income (`src/lib/sandbox-draft.ts`).
The income presets come from `wagePresets` in `src/lib/wage-presets.ts`.

### `/industries` and `/api/industries/*`

```
GET /api/industries/compare?occupation=gov_it&then=1985
 └── route handler
      ├── occupationComparisonQuerySchema          zod, server only; then defaults to 1985
      └── getOccupationComparison                  src/lib/industry/service.ts
           ├── getMetricsTable()
           ├── industrySourceFor(metrics)          the one place a data source is chosen
           │    └── createLocalIndustrySource      bundled catalog, src/data/occupations.ts
           └── compareOccupation(series, metrics)  src/lib/industry/occupation-comparison.ts
```

`IndustryDataSource` (`src/lib/industry/types.ts`) is the contract: list the
occupations, return one occupation's annual wage by year. The local source
serves a **placeholder** catalog: each occupation is a fixed multiple of the
national average wage, so it trends exactly like the average, and every
comparison says `Sample data`. Real series (BLS OEWS, CPS, OPM pay tables) go in
as a new source with `status: "observed"`, stored locally first and later in
Supabase, swapped in inside `industrySourceFor`. Nothing above it changes.

`compareOccupation` prices the deck's purchases in that occupation's working
time: hours for a used car, minutes for milk and eggs, years saving 15% for a
starter-home deposit, hours for a quarter-acre lot. The formulas are the
engine's own exports, so a person and an occupation are measured the same way.
The `/industries` page renders the first comparison on the server and fetches
the API on every change, keeping `?occupation=&then=` in the address bar.

### `/api/og/card`

```
GET /api/og/card?by=1996&inc=65000&card=2&fmt=story
 └── route.tsx (runtime = "edge")
      ├── parseComparisonQuery + ogOptionsSchema      400 JSON on any failure
      ├── compareGenerations(input, SEED_METRICS_TABLE)
      ├── buildStorySlides(result)[card - 1]
      └── new ImageResponse(<OgCard/>, { fonts, width, height })
```

- **Seed only.** Edge cannot hold a TCP Postgres client, and a shared image must
  not fail because a database paused itself.
- **Cached a year at the CDN** (`s-maxage=31536000`). The seed changes only on
  deploy, so a URL's image never changes within one.
- **Fonts are loaded once per isolate** at module scope, from string-literal
  `new URL(..., import.meta.url)` calls.
- Measured on `next start` locally: 0.20-0.58s per card warm, against the PRD's
  750ms p95. Not yet measured on Vercel's Edge.

---

## Rendering

Server components by default. Each client component is one because it owns an
interaction:

| Client component | Why |
|---|---|
| `StoryCarousel` | Embla, autoplay timer, keys, tap zones |
| `ModeSwitcher` | router navigation in a transition |
| `ShareModal` | `dialog`, clipboard, Web Share, image loading state |
| `Sandbox` | live comparison state, URL sync |
| `IndustryExplorer` | fetches the industries API on each choice |
| `LaborReceipt`, `DivergenceChart` | their toggles and the crosshair |

The cards themselves (`CardShell`, the other visuals) are plain components that
render inside the client carousel, and on the server inside the landing page's
preview.

**Bundle.** First Load JS for `/` is 143 kB. It was 240 kB while the zod schemas
lived in modules the client imported; moving them out took it down.

---

## The database

Drizzle ORM over `postgres` (postgres-js), with `prepare: false` so the same
connection string works through a transaction-mode pooler (Supabase, PgBouncer).

| Command | Does |
|---|---|
| `npm run db:generate` | Writes SQL into `drizzle/` from `src/db/schema.ts` |
| `npm run db:push` | Applies the schema to `DATABASE_URL` |
| `npm run db:seed` | Upserts every seed row into `yearly_metrics`, overwriting by `year` |

Nothing migrates or seeds at boot. Schema and data are applied deliberately,
before the deploy that needs them.

`numeric` columns arrive as strings so that Postgres never rounds through a
float; `src/db/row-mapping.ts` converts both ways.

---

## Identity

None, by design. No login, no account, no cookie. The brief is input to
reveal to share in under five seconds, and every wall in front of that is a lost
share.

---

## Honesty, as a property of the code

- **Modeled and preliminary are carried in the data.** `isEstimate` is a column;
  "(modeled)" is in the source line the card prints.
- **One copy model.** `story-content.ts` writes every sentence once, for the deck
  and the PNG, so a shared image cannot say something the page did not.
- **One verdict function.** No card can be coloured by its own rule.
- **Derived, never stored.** Nothing about a result is written down except the
  anonymous query; the story is recomputed from the URL every time.

---

## Verification

```bash
npm run typecheck
npm run lint
npm test              # vitest, 59 across 3 files
npm run build
npm run test:e2e      # playwright, 23: OG renders, bad requests, deck, share dialog
```

The Playwright config starts `next start` on port 3200 itself, so it needs a
build first. A turbopack build that dies part way can leave `.next` in a state
the next build refuses (`Invariant: no direct app page entry found for
/_not-found`); delete `.next` and build again.

---

## What this is not, yet

- **No Sources & Methodology view.** Each card names its source; nothing in the
  app explains the anchors or the splices. The script's header is the only
  write-up.
- **The real Postgres path is untested end to end.** Both fallbacks have been
  exercised against an unreachable database; `db:push`, `db:seed` and a live
  insert have not run against a real one.
- **No CI.** See GITHUB.md.
- **The year is a constant.** On 1 January 2027 `CURRENT_YEAR`, `LAST_DATA_YEAR`
  and the seed all have to move together.
- **No rate limit on `/api/og/card`.** Each uncached URL is a render; the CDN
  cache is the only protection.
- **Touch targets under 44px** in the deck header and on the receipt toggles.
