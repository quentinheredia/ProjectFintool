# Generational Buying Power Comparator (Working Title: *Parity*)
## Master Product Requirements Document (PRD) & Technical Blueprint

| Document Metadata | Details |
| :--- | :--- |
| **Document Version** | `v2.0` — Team Kickoff & Engineering Blueprint |
| **Date** | October 2026 |
| **Target Stack** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL (Supabase/Vercel), `@vercel/og` |
| **Core Experience** | A "Spotify Wrapped"-style interactive story carousel & viral social card generator comparing generational purchasing power in **Labor Hours** and **Life Years**. |

---

## 1. Executive Summary & Product Vision

### 1.1 The Problem
Economic debates between generations are dominated by anecdotes or flawed comparisons. Younger earners point out that housing and tuition have skyrocketed; older generations counter that starting salaries were much lower in the 1970s–1990s. Standard CPI inflation calculators fail to bridge this gap because essential milestone assets (homes, land, education, vehicles) have inflated at vastly different rates than consumer electronics or general CPI, while the statutory minimum wage has stagnated.

### 1.2 The Solution
**Parity** is a frictionless, mobile-first web application that requires only **two inputs** (`Birth Year` and `Current Annual Income`) to generate a personalized, 7-card **"Spotify Wrapped"-style Story Deck**. 

To ensure every comparison is intellectually honest and mathematically undeniable, the engine normalizes dollars into **Time Worked (Labor Hours / Saving Years)** and **Asset-to-Income Multipliers**. Users can swipe through their personalized economic reality check and export any individual slide—or a complete 2×2 summary bento card—directly to Instagram Stories, X, TikTok, or iMessage via Edge-rendered PNGs (`@vercel/og`).

### 1.3 Key Performance Indicators (KPIs)
* **Time-to-Value (TTV):** `< 3.5 seconds` from landing page arrival to viewing Card 1 of the story deck.
* **Viral Share Rate:** `> 25%` of completed sessions trigger a native share (`navigator.share`), clipboard copy, or PNG download.
* **Edge Rendering Latency:** `< 750ms` (p95) for dynamic 1080×1920 PNG generation via `/api/og/card`.
* **Data Auditability:** 100% of metrics linked directly to public government series (FRED, BLS, Census, NCES) via an in-app "Receipt / Sources" drawer.

---

## 2. User Journey & Experience Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. THE HOOK (Landing View)                                                 │
│ Minimalist, high-contrast prompt:                                          │
│ "How hard do you work for the exact same life your parents had?"           │
│ Inputs: [ Birth Year: 1996 ]  [ Annual Income: $68,000 ]  [ Compare → ]    │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 2. BENCHMARK RESOLUTION (Server-Side / <15ms Cached)                       │
│ • Current Age = 2026 - 1996 = 30 years old.                                │
│ • Parent Generation Benchmark = 30 years prior (1996, when a peer was 30). │
│ • Quick Toggle Pill at top of deck:                                        │
│   [ Vs. 30 Yrs Ago (1996) ]  |  [ Year I Turned 25 ]  |  [ Custom Decade ] │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 3. THE "WRAPPED" STORY CAROUSEL (7 Swipeable 9:16 Cards)                   │
│ • Card 1: The Dollar Reality Check (Purchasing Power & Real Wage Equivalence)│
│ • Card 2: The Down Payment Time-Tax (Years of Saving for Entry-Level Home) │
│ • Card 3: The Grocery Cart Receipt (Milk & Eggs in Minutes of Labor)       │
│ • Card 4: The Effort to Own Land (Work Hours per Quarter-Acre)             │
│ • Card 5: Minimum Wage vs. Used Car Divergence (Indexed Slope Chart)       │
│ • Card 6: The Moving Finish Line (Effective Retirement Age Shift)          │
│ • Card 7: The "Parity Wrapped" 2x2 Bento Summary Card                      │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 4. THE VIRAL EXPORT LOOP                                                   │
│ • User taps "Share This Slide" or "Share Full Summary"                     │
│ • App fetches /api/og/card?by=1996&inc=68000&card=2&fmt=story              │
│ • Mobile: Invokes native iOS/Android Share Sheet (Instagram, X, Messages)  │
│ • Desktop: One-click "Copy Image to Clipboard" + "Download PNG"            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Visual Standards & The 7-Card Story Specification

### 3.1 The 4-Layer Card Anatomy
Every slide in the web carousel and the corresponding `@vercel/og` image generator shares a strict layout grid (`1080x1920` for Stories, `1200x630` for Social Unfurls):

1. **Layer 1 — Progress & Eyebrow Header:**
   * Top Instagram-style segmented progress bar (`7 segments`).
   * Monospace uppercase eyebrow tag: `02 / THE HOUSING GRIND • 1996 VS 2026`.
2. **Layer 2 — The Hero Stat (The "Drop"):**
   * Massive display typography (`72px–96px`, tight tracking) highlighting the primary delta (`+5.4 YEARS`, `-62%`, `3.8x`).
3. **Layer 3 — The Mad-Libs Punchline:**
   * Maximum 22 words. High-contrast muted text with bold white/neon callouts for dynamic variables.
4. **Layer 4 — Micro-Visual & Citation Footer:**
   * A focused visual proof (2-bar comparison, thermal receipt, or slope chart).
   * Undeniable footer attribution: `DATA: US CENSUS & FRED • PARITY.APP [QR]`.

### 3.2 Dynamic Aura Color System
Cards dynamically shift their background/accent theme based on the calculated outcome to maintain intellectual honesty:
* **Crimson Alert (`Bg: #0A0A0C` / `Accent: #FF3366`):** Severe purchasing power erosion (`> 25%` worse than benchmark).
* **Amber Friction (`Bg: #0C1017` / `Accent: #FFB800`):** Moderate cost increase (`0% to 25%` worse than benchmark).
* **Emerald Surplus (`Bg: #061812` / `Accent: #10B981`):** User's income outpaces the historical benchmark (e.g., high earner or specific commodity improvement).

---

### 3.3 Card-by-Card Mathematical & Visual Spec

Let:
* $Y_b$ = Benchmark Year (e.g., `1996`), $Y_c$ = Current Year (`2026`)
* $I_u$ = User's Current Annual Income, $I_b$ = Median Annual Income in $Y_b$, $I_c$ = Median Annual Income in $Y_c$
* $W_u = \frac{I_u}{2080}$ (User's Hourly Wage based on standard 2,080 full-time annual hours)
* $W_b$ = Average Hourly Production/Nonsupervisory Wage in $Y_b$, $W_c$ = Average Hourly Wage in $Y_c$

---

#### Card 1: The Dollar Reality Check
* **Headline Copy:** *"Your dollar has **$X\%$ less purchasing power** than your parents' at the exact same stage in life."*
* **Sub-copy:** *"To match the buying power of a median **$[Age]$-year-old** in **$Y_b$** ($I_b$/yr), you need **$I_{\text{cpi\_parity}}$/yr** today. Your salary puts you **$[\text{Ahead/Behind}]$ by $\$[\text{Delta}]$**."*
* **Formulas:**
  $$\text{Dollar Purchasing Power Loss (\%)} = \left(1 - \frac{\text{CPI}_b}{\text{CPI}_c}\right) \times 100$$
  $$I_{\text{cpi\_parity}} = I_b \times \left(\frac{\text{CPI}_c}{\text{CPI}_b}\right)$$
* **Micro-Visual:** Split banknote visual showing `$1.00` in $Y_b$ eroded down to `$0.XX` today.

---

#### Card 2: The Down Payment Time-Tax (Entry-Level Housing)
* **Headline Copy:** *"You have to spend **$X$ more years** saving for an entry-level home than a peer did in **$Y_b$**."*
* **Sub-copy:** *"Assuming a disciplined **15% annual savings rate** toward a 20% down payment on a starter home ($80\%$ of median price)."*
* **Formulas:**
  $$\text{Starter Home Price } (H_{\text{starter}}) = 0.80 \times \text{MedianHomePrice}$$
  $$\text{Years to Save}_b = \frac{0.20 \times H_{\text{starter}, b}}{0.15 \times I_b}$$
  $$\text{Years to Save}_u = \frac{0.20 \times H_{\text{starter}, c}}{0.15 \times I_u}$$
  $$X = \text{Years to Save}_u - \text{Years to Save}_b$$
* **Secondary Metric (Full Home Multiplier):**
  $$M_b = \frac{\text{MedianHomePrice}_b}{I_b} \quad \text{vs.} \quad M_u = \frac{\text{MedianHomePrice}_c}{I_u}$$
* **Micro-Visual:** Horizontal life-calendar timeline comparing `Years to Keys (Benchmark)` vs. `Years to Keys (Today)`.

---

#### Card 3: The Grocery Cart Index (Milk & Eggs in Labor Minutes)
* **Headline Copy:** *"Milk & eggs are **$X\times$ more expensive** in raw cash—and cost **$Y$ minutes** of average labor today vs. **$Z$ minutes** in **$Y_b$**."*
* **Sub-copy:** *"At your personal salary, a weekly staple run takes **$U$ hours** of your work week."*
* **Formulas:**
  $$\text{Staple Basket } (B) = \text{Price}_{\text{Milk (1 Gal)}} + \text{Price}_{\text{Eggs (1 Doz)}} + \text{Price}_{\text{Ground Beef (1 lb)}} + \text{Price}_{\text{Bread (1 lb)}}$$
  $$\text{Nominal Multiplier } (X) = \frac{\text{Price}_{\text{Milk}, c} + \text{Price}_{\text{Eggs}, c}}{\text{Price}_{\text{Milk}, b} + \text{Price}_{\text{Eggs}, b}}$$
  $$\text{Labor Minutes}_b (Z) = \left(\frac{\text{Basket}_b}{W_b}\right) \times 60 \quad \big| \quad \text{Labor Minutes}_c (Y) = \left(\frac{\text{Basket}_c}{W_c}\right) \times 60$$
* **Micro-Visual:** **"The Labor-Hour Receipt"** — A high-contrast thermal grocery receipt where every item's price is printed in **Minutes of Life Worked** alongside nominal dollars.

---

#### Card 4: The Effort to Own Land
* **Headline Copy:** *"If you entered the market in **$Y_b$**, you would have had to put in **$X\%$ less effort** to own a quarter-acre of land."*
* **Sub-copy:** *"Measured in full-time work hours required to purchase a standardized $0.25$-acre residential lot."*
* **Formulas:**
  $$\text{LotPrice} = 0.25 \times \text{MedianLandAcrePrice}$$
  $$\text{WorkHours}_b = \frac{\text{LotPrice}_b}{I_b / 2080} \quad \big| \quad \text{WorkHours}_u = \frac{\text{LotPrice}_c}{I_u / 2080}$$
  $$\text{Effort Reduction (\%)} = \left(1 - \frac{\text{WorkHours}_b}{\text{WorkHours}_u}\right) \times 100$$
* **Micro-Visual:** Dot-matrix grid where each dot represents `100 hours of labor` traded for land.

---

#### Card 5: Minimum Wage vs. Used Car Divergence
* **Headline Copy:** *"Minimum wage in the **$[\text{Decade}]\text{s}$** was **$\$[\text{Min}_b]$**. Today it is **$\$[\text{Min}_c]$** ($+Z_1\%$). Over that same period, an average used car jumped **$+Z_2\%$**."*
* **Sub-copy:** *"In **$Y_b$**, a minimum-wage worker needed **$H_b$ hours** of work to buy a reliable used car. Today, it takes **$H_c$ hours**."*
* **Formulas:**
  $$Z_1 = \left(\frac{\text{MinWage}_c - \text{MinWage}_b}{\text{MinWage}_b}\right) \times 100 \quad \big| \quad Z_2 = \left(\frac{\text{UsedCar}_c - \text{UsedCar}_b}{\text{UsedCar}_b}\right) \times 100$$
  $$H_b = \frac{\text{UsedCar}_b}{\text{MinWage}_b} \quad \big| \quad H_c = \frac{\text{UsedCar}_c}{\text{MinWage}_c}$$
* **Micro-Visual:** **Indexed Divergence Fan Chart (Base 100 in $Y_b$)** plotting 4 lines from $Y_b = 100$ to $Y_c$:
  1. Federal Minimum Wage
  2. Median Personal Income
  3. Average Used Car Price
  4. Median Home Price

---

#### Card 6: The Moving Finish Line (Retirement Age)
* **Headline Copy:** *"The average retirement age has moved back by **$+X$ years** since the **$[\text{Decade}]\text{s}$**."*
* **Sub-copy:** *"In **$Y_b$**, workers retired at an average age of **$R_b$**. Today, the average retirement age is **$R_c$**—trading golden years for extra working years."*
* **Formulas:**
  $$X = R_c - R_b$$
* **Micro-Visual:** Horizontal life-span bar (`Age 20 to 80`) showing the "Career Block" encroaching into the "Retirement Block".

---

#### Card 7: The "Parity Wrapped" Summary Bento (All-in-One Shareable)
* **Layout:** A 2×2 high-density Bento Grid summarizing the user's top 4 customized metrics:
  * **Box 1 (Top-Left):** Home Price-to-Income Multiplier (`3.4x in 1996` $\rightarrow$ `6.8x for You`).
  * **Box 2 (Top-Right):** Your "Parity Salary" (The salary you *should* make today to match $Y_b$ housing buying power: $I_{\text{parity}} = \text{Home}_c \times \frac{I_b}{\text{Home}_b}$).
  * **Box 3 (Bottom-Left):** Used Car in Minimum Wage Hours (`H_b hrs` $\rightarrow$ `H_c hrs`).
  * **Box 4 (Bottom-Right):** Grocery Basket Multiplier & Retirement Shift (`+X.X Yrs`).

---

## 4. Authoritative Data Sources & Ingestion Pipeline

To ensure the app withstands scrutiny from economists, journalists, and social media fact-checkers, every column in our database maps to a documented federal or institutional data series.

### 4.1 Master Data Catalog (1965–2026)

| Database Column | Metric Description | Primary US Source & Series ID | Canadian Equivalent (Phase 2 Locale Toggle) | Frequency & Normalization |
| :--- | :--- | :--- | :--- | :--- |
| `median_income` | Nominal Median Personal / Household Income | **FRED / Census:** `MEPAINUSA646N` (Personal) & `MEHOINUSA646N` (Household) | **StatCan:** Table `11-10-0239-01` | Annual (Nominal USD). Using nominal values inside same-year ratios prevents double-counting inflation. |
| `avg_hourly_wage` | Avg Hourly Earnings of Production & Nonsupervisory Employees | **BLS / FRED:** `AHETPI` | **StatCan:** Table `14-10-0064-01` | Monthly $\rightarrow$ Annualized Average. |
| `federal_min_wage` | Statutory Federal Minimum Hourly Wage | **DOL / FRED:** `FEDMINNFRWG` | **StatCan / ESDC:** Population-Weighted Provincial Min Wage | Annual statutory rate. |
| `median_home_price` | Median Sales Price of Houses Sold | **FRED / HUD / Census:** `MSPUS` | **CREA / StatCan:** National MLS Composite Benchmark | Quarterly $\rightarrow$ Annualized Average. |
| `median_land_acre_price`| Standardized Residential Land Value per Acre | **FHFA / Lincoln Institute / AEI:** *LandPrice* Dataset (Residential Land Value) | **StatCan:** National Balance Sheet Residential Land Value | Annual. |
| `average_new_car` | Avg Transaction Price of New Light Vehicles | **BEA / KBB / BLS:** New Vehicle Transaction Series | **StatCan / Canadian Black Book** | Annual. |
| `avg_used_car_price` | Avg Used Vehicle Price | **BEA / Manheim / BLS:** Historical anchor + `CUSR0000SETA02` (Used Cars & Trucks CPI) | **StatCan:** Used Passenger Vehicles Index | Monthly $\rightarrow$ Annualized Average. |
| `average_tuition` | Avg Undergraduate Tuition, Fees, Room & Board (4-Yr Public) | **NCES:** Digest of Education Statistics Table `330.10` | **StatCan:** Table `37-10-0003-01` | Annual Academic Year. |
| `milk_gallon_price` | Fresh Whole Milk, per Gallon | **BLS / FRED:** `APU0000709112` | **StatCan:** Table `18-10-0245-01` | Monthly $\rightarrow$ Annualized Average. |
| `eggs_dozen_price` | Grade A Large Eggs, per Dozen | **BLS / FRED:** `APU0000708111` | **StatCan:** Table `18-10-0245-01` | Monthly $\rightarrow$ Annualized Average. |
| `ground_beef_lb_price`| Ground Chuck, 100% Beef, per Pound | **BLS / FRED:** `APU0000703112` | **StatCan:** Table `18-10-0245-01` | Monthly $\rightarrow$ Annualized Average. |
| `bread_lb_price` | White Pan Bread, per Pound | **BLS / FRED:** `APU0000702111` | **StatCan:** Table `18-10-0245-01` | Monthly $\rightarrow$ Annualized Average. |
| `avg_retirement_age` | Average Effective Retirement Age | **CRR (Boston College) / Gallup / OECD:** Effective Age of Labor Market Exit | **StatCan:** Table `14-10-0060-01` (Average retirement age) | Annual. |
| `cpi_index` | Consumer Price Index for All Urban Consumers | **BLS / FRED:** `CPIAUCSL` (1982–84 = 100) | **StatCan:** Table `18-10-0005-01` | Monthly $\rightarrow$ Annualized Average. |
| `mortgage_rate_30yr` | 30-Year Fixed Rate Mortgage Average | **Freddie Mac / FRED:** `MORTGAGE30US` | **Bank of Canada:** 5-Year Conventional Mortgage Rate | Weekly $\rightarrow$ Annualized Average. |

---

## 5. Technical Architecture & Database Schema

### 5.1 Why Drizzle ORM + PostgreSQL?
We use **Drizzle ORM** over Prisma because Drizzle has a **zero-Rust-binary footprint** (`~7kb`). This allows our `/api/og/card` **Vercel Edge Function** to query or validate cached data at the Edge with `0ms` cold-start penalty.

### 5.2 Complete Database Schema (`src/db/schema.ts`)

```typescript
import { pgTable, integer, numeric, uuid, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const yearlyMetrics = pgTable('yearly_metrics', {
  year: integer('year').primaryKey(), // 1965 to 2026

  // Income & Wage Anchors (Nominal USD)
  medianIncome: numeric('median_income', { precision: 12, scale: 2 }).notNull(),
  medianHouseholdIncome: numeric('median_household_income', { precision: 12, scale: 2 }).notNull(),
  avgHourlyWage: numeric('avg_hourly_wage', { precision: 8, scale: 2 }).notNull(),
  federalMinWage: numeric('federal_min_wage', { precision: 6, scale: 2 }).notNull(),

  // Major Life Milestone Assets (Nominal USD)
  medianHomePrice: numeric('median_home_price', { precision: 12, scale: 2 }).notNull(),
  medianLandAcrePrice: numeric('median_land_acre_price', { precision: 12, scale: 2 }).notNull(),
  averageNewCar: numeric('average_new_car', { precision: 10, scale: 2 }).notNull(),
  avgUsedCarPrice: numeric('avg_used_car_price', { precision: 10, scale: 2 }).notNull(),
  averageTuition: numeric('average_tuition', { precision: 10, scale: 2 }).notNull(),

  // Everyday Grocery Staples (Nominal USD)
  milkGallonPrice: numeric('milk_gallon_price', { precision: 6, scale: 2 }).notNull(),
  eggsDozenPrice: numeric('eggs_dozen_price', { precision: 6, scale: 2 }).notNull(),
  groundBeefLbPrice: numeric('ground_beef_lb_price', { precision: 6, scale: 2 }).notNull(),
  breadLbPrice: numeric('bread_lb_price', { precision: 6, scale: 2 }).notNull(),

  // Macro & Lifecycle Indicators
  cpiIndex: numeric('cpi_index', { precision: 8, scale: 3 }).notNull(),
  mortgageRate30Yr: numeric('mortgage_rate_30yr', { precision: 5, scale: 2 }).notNull(),
  avgRetirementAge: numeric('avg_retirement_age', { precision: 4, scale: 1 }).notNull(),

  // Metadata
  isPreliminaryEstimate: boolean('is_preliminary_estimate').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const anonymousQueries = pgTable(
  'anonymous_queries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    birthYear: integer('birth_year').notNull(),
    benchmarkYear: integer('benchmark_year').notNull(),
    userIncome: numeric('user_income', { precision: 12, scale: 2 }).notNull(),
    sharedCardId: integer('shared_card_id'), // Null unless user clicks Share on a specific slide
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_anonymous_queries_birth_year').on(table.birthYear),
    index('idx_anonymous_queries_created_at').on(table.createdAt),
  ]
);
```

### 5.3 Caching & Zero-Latency Strategy
Because `yearly_metrics` contains only **62 rows** (`1965–2026`), we do not need a round-trip database query on every user request:
1. Wrap `getAllYearlyMetrics()` in Next.js `unstable_cache` with a `revalidate: 86400` (24-hour TTL) and tag `['yearly-metrics']`.
2. Any calculation request (`/api/compare` or Server Action) reads from the in-memory/Data Cache in `< 2ms`.
3. Logging to `anonymous_queries` uses Next.js 15's `after()` API so the analytics insert executes **after** the HTTP response is sent to the user.

---

## 6. MCP Server Stack for AI-Assisted Engineering

To maximize team velocity in Cursor, Claude Code, or Windsurf, configure a workspace `.mcp.json` file in the repository root with the following Model Context Protocol (MCP) servers:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://localhost:5432/parity_dev"
      ]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

### How Our Agents Use These MCPs:
1. **`fetch` MCP (Data Pipeline Agent):** Queries the FRED API (`api.stlouisfed.org/fred/series/observations`), cross-checks historical NCES and BLS tables, and generates the verified `src/db/seed-data.ts` file.
2. **`postgres` MCP (Backend Agent):** Verifies that all 62 years (`1965–2026`) have zero `NULL` values, tests SQL percentile aggregations on `anonymous_queries`, and validates Drizzle migrations.
3. **`playwright` MCP (Frontend & Viral OG Agent):** Opens headless mobile viewports (`390x844`), tests swipe gestures on the 7-card carousel, hits `/api/og/card?by=1996&inc=68000&card=1..7`, and visually inspects the rendered PNGs to ensure zero text clipping or layout overflow in Satori.

---

## 7. Implementation Roadmap & Phases

### Phase 1: Data Engineering & Schema Foundation (Days 1–3)
* **Deliverables:**
  * Initialize Next.js 15 App Router project with TypeScript, Tailwind CSS v4, and Drizzle ORM.
  * Build `scripts/fetch-fred-seed.ts` to pull all FRED series (`MSPUS`, `MEPAINUSA646N`, `AHETPI`, `FEDMINNFRWG`, `APU0000709112`, `APU0000708111`, `APU0000703112`, `APU0000702111`, `CPIAUCSL`, `MORTGAGE30US`) and merge with static CSVs for NCES tuition, FHFA land prices, and CRR retirement age.
  * Seed local and staging PostgreSQL databases (`1965–2026`).
* **Exit Criteria:** Running `pnpm db:verify` passes 100% completeness checks across all 62 years.

### Phase 2: The Computation Engine & API Layer (Days 4–6)
* **Deliverables:**
  * Build `src/lib/comparator-engine.ts` with pure, deterministic TypeScript functions for all 7 cards.
  * Implement input validation via Zod (`birthYear: 1945..2008`, `income: 1..10_000_000`).
  * Create the cached data fetcher and non-blocking `anonymous_queries` logger using Next.js `after()`.
* **Exit Criteria:** 100% unit test coverage in Vitest across all 7 card calculation formulas.

### Phase 3: The "Wrapped" Carousel UI & Interactive Charts (Days 7–10)
* **Deliverables:**
  * Build the minimalist Landing Hook screen with instant currency formatting and keyboard navigation.
  * Build the 7-card Story Carousel using `embla-carousel-react` + `framer-motion` with Instagram-style top segmented progress bars, tap-left/tap-right navigation, and dynamic Aura background transitions.
  * Build the **Labor-Hour Thermal Receipt** component (Card 3) and the **Base-100 Indexed Divergence Chart** (Card 5).
  * Build the expandable "Sources & Methodology" modal linking every number to its exact FRED/BLS table.

### Phase 4: The Viral OG Engine & Native Share Loop (Days 11–13)
* **Deliverables:**
  * Build `/api/og/card/route.tsx` using `@vercel/og` with bundled `Geist Sans`, `Geist Mono`, and `Instrument Serif` fonts.
  * Support both `fmt=story` (`1080x1920`) and `fmt=social` (`1200x630`).
  * Implement the client-side Share Controller:
    * Mobile: Fetch PNG blob $\rightarrow$ construct `File` $\rightarrow$ invoke `navigator.share({ files: [file] })`.
    * Desktop: One-click `ClipboardItem` image copy + direct PNG download + dynamic URL share (`/share?by=1996&inc=68000&card=7`) for automatic Twitter/iMessage OpenGraph card unfurling.

---

## 8. Comprehensive Testing & QA Specification

### 8.1 Mathematical Unit Tests (`Vitest`)
Every formula in `src/lib/comparator-engine.ts` must pass deterministic snapshot and boundary tests:
* **Test Case 1 (Standard Millennial Input):** `birthYear = 1996`, `income = 65000`, `currentYear = 2026`, `benchmarkMode = 'parent_generation' (1996)`.
  * Verify Card 1 CPI erosion percentage matches exact `1 - (CPI_1996 / CPI_2026)`.
  * Verify Card 2 Down Payment saving years accurately reflects `0.20 * (0.80 * HomePrice) / (0.15 * Income)`.
  * Verify Card 3 Labor Minutes accurately divides basket cost by hourly wage (`income / 2080` for user, `avg_hourly_wage` for historical baseline).
* **Test Case 2 (High-Earner Surplus Handling):** `birthYear = 1996`, `income = 450000`.
  * Verify copy state flips from `"more years"` / `"deficit"` to `"fewer years"` / `"surplus"` and Aura theme shifts to `Emerald (#10B981)`.
* **Test Case 3 (Out-of-Bounds Clamping):**
  * If resolved benchmark year is `< 1965` (e.g., user selects custom benchmark year `1955`), engine gracefully clamps to `1965` and returns `meta.clampedYear = 1965`.

### 8.2 Edge OG Image & Visual Regression Tests (`Playwright`)
* Loop through `cardId = 1` to `7` at `/api/og/card?by=1995&inc=72000&card=${id}&fmt=story`.
* Assert HTTP `200`, `Content-Type: image/png`, execution time `< 800ms` (warm), and verify extreme income strings (`$1,500,000`) do not overflow container bounds.

### 8.3 End-to-End Device Matrix
* **iOS Safari (iPhone 15/16):** Verify `navigator.share` successfully passes the generated PNG file directly to the Instagram Stories and iMessage targets.
* **Android Chrome:** Verify Web Share API file payload and swipe-carousel touch inertia.
* **Desktop Chrome / Safari / Firefox:** Verify keyboard arrow navigation (`Left` / `Right` keys advance slides) and `navigator.clipboard.write` image copying.