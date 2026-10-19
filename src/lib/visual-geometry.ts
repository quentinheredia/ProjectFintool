import type { DivergenceSeries } from "./comparator-engine";

/** Shared by the web deck visuals and the OG renderer so both draw the same picture. */

export const MAX_YEAR_BLOCKS = 36;
export const MAX_LAND_DOTS = 160;
const LARGE_LAND_HOURS = 16_000;

export function landHoursPerDot(largestHours: number): number {
  return largestHours > LARGE_LAND_HOURS ? 1_000 : 100;
}

export const RETIREMENT_SPAN = { startAge: 20, endAge: 80 } as const;

export function careerSharePct(retirementAge: number): number {
  const { startAge, endAge } = RETIREMENT_SPAN;
  return ((retirementAge - startAge) / (endAge - startAge)) * 100;
}

/** Categorical slots 1-4, validated together against the #161616 chart surface (dark mode). */
export const DIVERGENCE_SERIES_STYLE: Record<DivergenceSeries, { label: string; color: string }> = {
  minimumWage: { label: "Min wage", color: "#3987e5" },
  usedCar: { label: "Used car", color: "#d95926" },
  medianIncome: { label: "Earnings", color: "#199e70" },
  homePrice: { label: "Home", color: "#c98500" },
};

/** Fraction of the dollar-note width given to a full $1.00, leaving room for the label beside it. */
export const DOLLAR_NOTE_MAX_WIDTH_PCT = 55;
