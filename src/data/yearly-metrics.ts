export const FIRST_DATA_YEAR = 1965;
export const LAST_DATA_YEAR = 2026;

/** One year of nominal US macro data. Mirrors `yearly_metrics` with numbers instead of numeric strings. */
export interface YearlyMetrics {
  year: number;
  medianIncome: number;
  medianHomePrice: number;
  averageNewCar: number;
  avgUsedCarPrice: number;
  averageTuition: number;
  cpiIndex: number;
  federalMinWage: number;
  avgHourlyWage: number;
  milkGallonPrice: number;
  eggsDozenPrice: number;
  groundBeefLbPrice: number;
  medianLandAcrePrice: number;
  avgRetirementAge: number;
  mortgageRate30Yr: number | null;
  isEstimate: boolean;
}

export type MetricsTable = ReadonlyMap<number, YearlyMetrics>;

export function toMetricsTable(rows: readonly YearlyMetrics[]): MetricsTable {
  return new Map(rows.map((row) => [row.year, row]));
}
