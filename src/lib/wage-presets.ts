import type { YearlyMetrics } from "@/data/yearly-metrics";
import { minimumWageAnnualIncome } from "./comparator-engine";

/** EPI analysis of SSA wage statistics: average annual wages of the top 1% of earners, 2023. */
const TOP_1_PCT_ANNUAL_WAGE = 794_129;

export interface WagePreset {
  id: string;
  label: string;
  annualIncome: number;
}

/** Shortcuts that fill the income field. A new group (an industry, a public pay scale) is another entry here. */
export function wagePresets(now: YearlyMetrics): WagePreset[] {
  return [
    { id: "minimum", label: "Minimum", annualIncome: Math.round(minimumWageAnnualIncome(now)) },
    { id: "median", label: "Median", annualIncome: Math.round(now.medianIncome) },
    { id: "top_1", label: "Top 1%", annualIncome: TOP_1_PCT_ANNUAL_WAGE },
  ];
}
