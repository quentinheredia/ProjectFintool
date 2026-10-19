/** Upserts the bundled historical seed into yearly_metrics. Run: npm run db:seed */
import { getTableColumns, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { HISTORICAL_SEED } from "../src/data/historical-seed";
import { toDbRow } from "../src/db/row-mapping";
import { yearlyMetrics } from "../src/db/schema";

const NON_OVERWRITTEN_FIELDS = new Set(["year", "updatedAt"]);

function overwriteFromExcludedRow() {
  const dataColumns = Object.entries(getTableColumns(yearlyMetrics)).filter(
    ([field]) => !NON_OVERWRITTEN_FIELDS.has(field),
  );
  return {
    ...Object.fromEntries(dataColumns.map(([field, column]) => [field, sql.raw(`excluded.${column.name}`)])),
    updatedAt: sql`now()`,
  };
}

async function seed(databaseUrl: string): Promise<void> {
  const client = postgres(databaseUrl, { prepare: false, max: 1 });
  try {
    await drizzle(client)
      .insert(yearlyMetrics)
      .values(HISTORICAL_SEED.map(toDbRow))
      .onConflictDoUpdate({ target: yearlyMetrics.year, set: overwriteFromExcludedRow() });
    console.log(`Upserted ${HISTORICAL_SEED.length} rows into yearly_metrics`);
  } finally {
    await client.end();
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}
seed(databaseUrl).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
