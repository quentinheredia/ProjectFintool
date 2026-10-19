import type { YearlyMetrics } from "@/data/yearly-metrics";
import type { NewYearlyMetricsRow, YearlyMetricsRow } from "./schema";

const REQUIRED_NUMERIC_FIELDS = [
  "medianIncome",
  "medianHomePrice",
  "averageNewCar",
  "avgUsedCarPrice",
  "averageTuition",
  "cpiIndex",
  "federalMinWage",
  "avgHourlyWage",
  "milkGallonPrice",
  "eggsDozenPrice",
  "groundBeefLbPrice",
  "medianLandAcrePrice",
  "avgRetirementAge",
] as const satisfies readonly (keyof YearlyMetrics)[];

type RequiredNumericField = (typeof REQUIRED_NUMERIC_FIELDS)[number];

/** Postgres `numeric` columns arrive as strings to avoid float precision loss; the engine works in numbers. */
export function fromDbRow(row: YearlyMetricsRow): YearlyMetrics {
  const numericValues = Object.fromEntries(
    REQUIRED_NUMERIC_FIELDS.map((field) => [field, Number(row[field])]),
  ) as Record<RequiredNumericField, number>;
  return {
    year: row.year,
    ...numericValues,
    mortgageRate30Yr: row.mortgageRate30Yr === null ? null : Number(row.mortgageRate30Yr),
    isEstimate: row.isEstimate,
  };
}

export function toDbRow(metrics: YearlyMetrics): NewYearlyMetricsRow {
  const numericValues = Object.fromEntries(
    REQUIRED_NUMERIC_FIELDS.map((field) => [field, String(metrics[field])]),
  ) as Record<RequiredNumericField, string>;
  return {
    year: metrics.year,
    ...numericValues,
    mortgageRate30Yr: metrics.mortgageRate30Yr === null ? null : String(metrics.mortgageRate30Yr),
    isEstimate: metrics.isEstimate,
  };
}
