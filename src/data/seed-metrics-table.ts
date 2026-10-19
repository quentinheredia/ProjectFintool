import { HISTORICAL_SEED } from "./historical-seed";
import { toMetricsTable } from "./yearly-metrics";

/** In-memory dataset with no database dependency, safe to import from Edge runtimes. */
export const SEED_METRICS_TABLE = toMetricsTable(HISTORICAL_SEED);
