# Parity - system register

What exists, where the truth lives, and what you are not allowed to do.
Visual specification - colour, type, spacing, motion values - is
[`docs/DESIGN.md`](./DESIGN.md). This file is the map.

---

## Sources of truth

Each fact has exactly one home. When two places could answer a question, the
one below wins and the other reads from it.

| Question | Answer lives in | Notes |
|---|---|---|
| What the product is meant to be | `generational_buying_power_comparator_master_prd.md` | The brief. Where the code departs from it, the departure is listed under **Deviations from the PRD** below, with the reason |
| Colour, type and surface tokens | `src/app/globals.css` `:root` + `@theme inline` | Tailwind v4. There is **no** `tailwind.config.*` |
| The three aura palettes | `src/lib/aura.ts` (`AURA_THEMES`) | Read by the web deck **and** the OG renderer. Never re-declare a hex at a call site |
| Which aura a card gets | `verdictFor` in `src/lib/comparator-engine.ts` | One function, one threshold (`SEVERE_BURDEN_RATIO = 1.25`) for every card |
| What the design rules mean | `docs/DESIGN.md` | Prose + tables. The CSS is the values, this is the reasoning |
| How the code is shaped | `docs/ARCHITECTURE.md` | A description of what runs, not a plan |
| How a change reaches `master` | `docs/GITHUB.md` | Branches, commits, the test that fails first, pull requests, tags |
| Every yearly figure, 1965-2026 | `src/data/historical-seed.ts` | **Generated.** Never edited by hand |
| How those figures were made | `scripts/build-historical-seed.ts` | FRED series ids, splices, backcasts and the anchor tables for series FRED does not carry. The methodology comment at the top is the citation |
| The shape of one year | `src/data/yearly-metrics.ts` (`YearlyMetrics`) | Numbers, not the numeric strings Postgres returns |
| The database shape | `src/db/schema.ts` | Drizzle. `drizzle/` holds what `drizzle-kit generate` wrote from it |
| Postgres or the bundled seed | `getMetricsTable` in `src/db/index.ts` | Postgres when `DATABASE_URL` is set and the table is complete, otherwise the seed. Never a mix of the two |
| Every formula | `src/lib/comparator-engine.ts` | Pure. The only place a card's number is computed |
| What input is valid | `src/lib/comparator-input.ts` | Zod. Kept out of the engine so zod never reaches the browser |
| What an OG request may ask for | `src/lib/og-options-schema.ts` | Zod, server only, same reason |
| URL keys (`by` `inc` `mode` `year`) | `src/lib/query-params.ts` | The share link and the OG link use the same keys |
| The share link | `buildSharePath` in the engine | The URL **is** the result. There is no other state to share |
| The OG image link | `buildOgImagePath` in `src/lib/og-card-params.ts` | Share path + `card` + `fmt` |
| Card words: eyebrow, hero, caption, mad-libs, source | `src/lib/story-content.ts` | Read by the web deck **and** the PNG. Copy is written once |
| How a number prints | `src/lib/format.ts` | `Intl.NumberFormat`, never a hand-built string |
| Geometry both renderers draw | `src/lib/visual-geometry.ts` | Dots per hour, year blocks, the retirement span, the chart palette |
| Chart series colours | `DIVERGENCE_SERIES_STYLE` in `visual-geometry.ts` | Validated as a set against `#161616`. See DESIGN.md before touching |
| OG fonts | `src/app/api/og/card/fonts/` | Geist, Geist SemiBold, Geist Mono. SIL OFL |
| Query analytics | `src/db/anonymous-queries.ts` | Written after the response, best effort |
| The current year | `CURRENT_YEAR` in the engine **and** `LAST_DATA_YEAR` in `yearly-metrics.ts` | Two constants that must agree. A known duplication; see **Known** |

### Generated, not written

`src/data/historical-seed.ts` is the output of `npm run data:build`, which
fetches FRED live. To change a figure, change the script (a series id, a splice,
an anchor point and its source), rerun it, and commit the regenerated file in a
commit of its own with the script's output quoted. A hand edit to the seed is a
figure with no source, and the next rebuild silently reverts it.

---

## Restrictions

Things that are wrong here even when they are normal elsewhere.

### Honesty

- **Never invent a figure.** Every number on a card is computed by the engine
  from the seed. No sample results, no illustrative salaries, no rounded-up
  "about" figures in copy.
- **Modeled is labelled modeled.** Land, used and new cars, tuition and
  retirement age are interpolated between published anchor points, not read
  off a live series. Their cards say `(modeled)` in the source line, and the
  anchor table in the script names where each point came from. A new series
  arrives with a FRED id or with an anchor table and its source - never a bare
  number.
- **The current year is preliminary, and says so.** `isEstimate` is true for
  2026 only (year-to-date averages, income projected). Cards 1 and 7 print the
  footnote. Removing it while the year is incomplete is a false claim.
- **Like is compared with like.** The benchmark earner is the BLS median
  *full-time* worker, because the user types a full-time salary. Census median
  personal income counts part-timers, students and retirees and made a $65K
  earner look better off than a 1996 peer. See **Deviations**.
- **A surplus is shown as a surplus.** A high earner who beats the benchmark
  gets emerald and "fewer years". The threshold is never tuned to make results
  look worse; the app's credibility is that it can say "you are ahead".
- **The hero agrees with the sentence under it.** Where copy quotes rounded
  figures, the hero is derived from those rounded figures: `6.7 vs 5.9` reads
  `+0.8`, never `+0.9`. A reader checks the subtraction.
- **A ratio below 1 prints two decimals.** `0.04x`, never `0.0x`, which reads as
  "free".
- **A clamped year says so on screen.** A benchmark outside 1965-2025 is moved
  to the edge and the deck prints which year was asked for and which is shown.

### Layout

- **Four layers, every card.** Eyebrow, hero stat, mad-libs copy, micro-visual
  and source footer. A card without a source line is not finished.
- **One accent per card: its aura's.** Brand crimson `#FF3366` belongs to the
  landing page. Inside the deck, colour means verdict.
- **Dark only, by decision.** The aura palettes are dark by brief; a light theme
  would need its own validated chart palette. Not an oversight.
- **Radius is not uniform.** Card frame and dialog `24px`, share preview `16px`,
  panels, tiles and inputs `12px`, receipt paper `6px`, buttons and pills
  `999px`. See DESIGN.md.
- **No em dash, no en dash** in anything a person reads, including these docs.
  A clause break is a spaced hyphen, a range is a hyphen.
- **The eyebrow is the one numbered label.** `02 / HOUSING GRIND • 1996 VS 2026`
  is in the brief and orients a reader inside a seven-card story. No other
  `01 02 03` counters, anywhere.
- **The page body never scrolls sideways.** Measured at 390x844 and 1440x900 on
  every card, including a $10,000,000 income against 1965.

### Colour

- Three auras, by burden ratio (effort now / effort then):

  | Aura | Background | Accent | Means |
  |---|---|---|---|
  | crimson | `#0A0A0A` | `#FF3366` | more than 25% harder |
  | amber | `#0F172A` | `#FFB800` | harder, up to 25% |
  | emerald | `#061E16` | `#10B981` | equal or easier |

- Text is `#F5F5F2`, never `#FFFFFF`.
- The four chart colours were run through the dataviz validator as a set
  against `#161616`. Changing one means rerunning it for all four.

### Motion

- **The story autoplays, 8 seconds a card, and stops for good** the first time
  a person navigates themselves. A pause control is always offered while it
  runs; holding a press pauses it too; reduced motion never starts it.
- **No `whileInView`, no entrance animation on cards.** The only motion is the
  carousel itself, the progress fill, colour transitions and the aura crossfade
  behind the card.
- No animation library. Embla moves the slides; everything else is CSS.
- `prefers-reduced-motion` removes autoplay and transitions; content never lives
  in motion.

### Accessibility

- Every navigation has three ways in: swipe, tap zones (left 30% back, right
  70% forward) and the arrow keys, plus labelled buttons. On a phone those are
  `sr-only`; on desktop they are visible.
- The active card is announced in a polite live region.
- The divergence chart is keyboard-scrubbable and carries an `sr-only` table of
  every value. Its legend chips are `aria-pressed` toggles.
- Toggles are `aria-pressed` buttons, never colour alone.
- Form errors sit under their field, are linked by `aria-describedby`, and the
  first one receives focus.
- **Known gap:** the deck header controls (share, close, pause) are 32px, the
  mode select and the receipt toggles about 28px. Under the 44px floor.

### Code

- **The engine is pure.** No I/O, no clock, no randomness. A card's number is a
  function of the input and the table.
- **Zod never reaches the browser.** Schemas live in `comparator-input.ts` and
  `og-options-schema.ts`; client components import the engine and
  `og-card-params.ts` only. After a build, no chunk in `.next/static/chunks`
  should contain `Enter your birth year`.
- **`src/db/**` is server only** and never imported by a client component.
- **The OG route reads the seed, never the database.** It runs on Edge, where a
  TCP Postgres client does not, and a shared image must not depend on a database
  being awake.
- **Satori rules** in `og-card.tsx`: inline styles only, `display: "flex"` on
  every element with more than one child, no CSS Grid, one string per text node.
  Mad-libs copy is laid out word by word because Satori cannot wrap across
  sibling spans.
- **Font URLs are string literals.** `new URL("./fonts/Geist-SemiBold.ttf",
  import.meta.url)`. A template string resolved every font to the same file,
  with no error, and the PNGs silently lost their mono and bold faces.
- Refactor before extending. A geometry rule both renderers need goes in
  `visual-geometry.ts`, not into two components.
- Names carry the logic; comments carry the reasoning names cannot.

---

## Deviations from the PRD

| PRD says | Code does | Why |
|---|---|---|
| `median_income` from Census `MEPAINUSA646N` | BLS `LEU0252881500A` x 52 | Like is compared with like. 1996 personal median was $17,590; full-time median $25,480 |
| `bread_lb_price`, `median_household_income` columns | Not present | The build prompt's schema won; the basket is milk + eggs (+ beef on the receipt) |
| `framer-motion` in the carousel | None | Embla and CSS cover every motion the deck has |
| Instrument Serif in the OG fonts | Geist family only | One family across web and PNG |
| A Sources & Methodology drawer | Source line per card only | Not built yet |
| `anonymous_queries.sharedCardId`, indexes | Not present | The build prompt's schema won |
| Card 1 parity as `I_b x CPI_c / CPI_b` only | Both that and the prompt's `I_u x CPI_b / CPI_c` | The prompt asked for one, the PRD for the other; both are true |

---

## Components

### Pages and shells

| Component | File | Notes |
|---|---|---|
| `Home` | `src/app/page.tsx` | Server. Landing when the query is empty or invalid, the deck when it is valid. Also `generateMetadata` for link unfurls |
| `Landing`, `PreviewStack` | `src/app/page.tsx` | The preview is two real cards rendered `inert`, not a picture of one |
| `ComparatorForm` | `components/ComparatorForm.tsx` | A plain GET form. Works before JavaScript; the result URL is the share URL |
| `StoryCarousel` | `components/StoryCarousel.tsx` | Embla, progress segments, autoplay, tap zones, keys, aura behind the frame |
| `ModeSwitcher` | `components/ModeSwitcher.tsx` | Native `select`; navigates to a new share path |
| `ShareModal` | `components/ShareModal.tsx` | Native `dialog`. Preview, format toggle, share, copy image, download, copy link |

### Cards

| Component | File | Notes |
|---|---|---|
| `CardShell` | `components/story/CardShell.tsx` | The four layers. Every card is one |
| `StorySlide` | `components/story/StorySlide.tsx` | Picks the visual by `card.kind` from a typed record |
| `DollarErosion` | `story/visuals/DollarErosion.tsx` | Card 1, `$1.00` then vs what it buys now |
| `KeysTimeline` | `story/visuals/KeysTimeline.tsx` | Card 2, one block per year of saving |
| `LaborReceipt` | `story/visuals/LaborReceipt.tsx` | Card 3, client. My / median / minimum wage |
| `LandDots` | `story/visuals/LandDots.tsx` | Card 4, one dot per 100 (or 1,000) hours |
| `DivergenceChart` | `story/visuals/DivergenceChart.tsx` | Card 5, client. Base 100, toggles, crosshair |
| `RetirementBar` | `story/visuals/RetirementBar.tsx` | Card 6, ages 20 to 80 |
| `SummaryBento` | `story/visuals/SummaryBento.tsx` | Card 7, 2x2 |
| `OgCard` and its visuals | `src/app/api/og/card/og-card.tsx` | The same seven pictures in Satori's dialect, story and social layouts |

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing, or the seven-card deck when `by` and `inc` are present |
| `/api/og/card` | PNG of one card. `fmt=story` 1080x1920, `fmt=social` 1200x630. Edge, cached a year |

### Query keys

| Key | Means | Valid |
|---|---|---|
| `by` | birth year | 1945-2008 |
| `inc` | annual gross income, USD | 1,000-10,000,000 |
| `mode` | `parent_peer` `age_25` `age_30` `custom` | default `parent_peer` |
| `year` | benchmark year, `custom` only | any year; clamped to 1965-2025 and reported |
| `card` | OG only | 1-7, default 7 |
| `fmt` | OG only | `story` `social`, default `story` |

---

## Built for what comes next

- **The URL is the state.** No session, no cookie, no stored result. A share
  link, a refresh and a link unfurl all rebuild the same story.
- **The seed is the fallback, not the dev mode.** Postgres can be down, empty or
  half-seeded and the app still answers with real figures.
- **One copy model, two renderers.** A new card is a formula in the engine, a
  body in `story-content.ts`, and one visual per renderer.
- **The schema is applied, not just drafted.** `npm run db:push` creates it and
  `npm run db:seed` upserts every year.

---

## Known

- `CURRENT_YEAR` (engine) and `LAST_DATA_YEAR` (data) are separate constants
  that must both move, with a data rebuild, when the year turns.
- Deck controls under the 44px touch floor (above).
- The real Postgres write path (`db:seed`, `anonymous_queries`) has been
  exercised against an unreachable database, not a live one.
- The branch is `master`, not `main`.

---

## Verification

`npm test` - 59 tests across 3 files. `npm run typecheck`, `npm run lint` and
`npm run build` must all be clean before a commit. `npm run test:e2e` - 23
Playwright tests: every card in both formats, bad requests, a latency budget,
and the deck and share dialog at 390x844.

Two environment limits that look like bugs:

- The UI tests default to the Edge browser channel (`E2E_BROWSER_CHANNEL`)
  because this machine has no Chrome. CI will want `npx playwright install
  chromium` and `E2E_BROWSER_CHANNEL=chromium`.
- Pressing an arrow key before hydration does nothing. Tests wait for
  `[data-carousel-ready]` first.
