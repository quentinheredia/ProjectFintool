import type { YearlyMetrics } from "@/data/yearly-metrics";
import type { ComparatorInput } from "./comparator-engine";

/** The comparison the tour and the landing preview show: a median earner born in 1996, parent unknown. */
export function sampleComparisonInput(now: YearlyMetrics): ComparatorInput & { income: number } {
  return { birthYear: 1996, income: Math.round(now.medianIncome), comparisonMode: "parent_peer" };
}
