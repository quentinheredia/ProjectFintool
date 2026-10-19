import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { SEED_METRICS_TABLE } from "@/data/seed-metrics-table";
import { FIRST_DATA_YEAR, LAST_DATA_YEAR, toMetricsTable, type MetricsTable } from "@/data/yearly-metrics";
import { fromDbRow } from "./row-mapping";
import { anonymousQueries, yearlyMetrics } from "./schema";

const EXPECTED_YEAR_COUNT = LAST_DATA_YEAR - FIRST_DATA_YEAR + 1;

function createDb(databaseUrl: string) {
  // prepare: false keeps the client compatible with transaction-mode poolers (Supabase, PgBouncer).
  return drizzle(postgres(databaseUrl, { prepare: false }), { schema: { yearlyMetrics, anonymousQueries } });
}

/** Null when DATABASE_URL is not configured; callers then run purely on the bundled seed. */
export const db = process.env.DATABASE_URL ? createDb(process.env.DATABASE_URL) : null;

/**
 * Loads every year of metrics, preferring Postgres and falling back to the bundled seed when the
 * database is unconfigured, unreachable, or not yet fully seeded.
 */
export async function getMetricsTable(): Promise<MetricsTable> {
  if (!db) return SEED_METRICS_TABLE;
  try {
    const rows = await db.select().from(yearlyMetrics);
    if (rows.length < EXPECTED_YEAR_COUNT) return SEED_METRICS_TABLE;
    return toMetricsTable(rows.map(fromDbRow));
  } catch (error) {
    console.warn("yearly_metrics query failed; serving bundled seed", error);
    return SEED_METRICS_TABLE;
  }
}
