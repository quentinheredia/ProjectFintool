# Parity

How hard do you work for the life your parents had? Two inputs, birth year and
income, become a seven-card story comparing your buying power in 2026 with a
peer 30 years earlier, measured in years saved and hours worked. Every card
exports as a PNG for Stories or a social post.

Built from US federal data (BLS, FRED, Census, NCES); where no federal series
exists the figure is modeled and the card says so.

## Run it

```bash
npm install
npm run dev                 # http://localhost:3000
```

No database is needed: without `DATABASE_URL` the app serves the bundled
1965-2026 dataset. Copy `.env.example` to `.env.local` to set one.

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server. Stop `dev` first; both use `.next` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright: OG images and the deck. Needs a build; starts `next start` on port 3200 |
| `npm run data:build` | Regenerates `src/data/historical-seed.ts` from FRED. Needs network |
| `npm run db:push` | Applies `src/db/schema.ts` to `DATABASE_URL` |
| `npm run db:seed` | Upserts the dataset into `yearly_metrics` |
| `npm run db:generate` | Writes SQL migrations into `drizzle/` |

Try it: `/?by=1996&inc=65000`. One card as an image:
`/api/og/card?by=1996&inc=65000&card=2&fmt=story`.

## Read next

| | |
|---|---|
| [docs/SYSTEM.md](docs/SYSTEM.md) | Where each fact lives, and what nobody is allowed to do |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How a request becomes a story, and where the data comes from |
| [docs/DESIGN.md](docs/DESIGN.md) | Colour, type, the card, motion |
| [docs/GITHUB.md](docs/GITHUB.md) | How a change reaches `master` |
| [The PRD](generational_buying_power_comparator_master_prd.md) | The original brief |
