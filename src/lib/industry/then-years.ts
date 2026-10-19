import { FIRST_DATA_YEAR } from "@/data/yearly-metrics";
import { CURRENT_YEAR } from "../comparator-engine";

/** The 1980s, the default "then" for an industry comparison. */
export const DEFAULT_INDUSTRY_THEN_YEAR = 1985;
export const INDUSTRY_THEN_YEAR_RANGE = { min: FIRST_DATA_YEAR, max: CURRENT_YEAR - 1 } as const;
