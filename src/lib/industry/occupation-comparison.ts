import type { MetricsTable, YearlyMetrics } from "@/data/yearly-metrics";
import {
  CURRENT_YEAR,
  FULL_TIME_HOURS_PER_YEAR,
  MissingMetricsYearError,
  geometricMean,
  groceryBasketPrice,
  laborMinutes,
  metricsFor,
  quarterAcreLotCost,
  verdictFor,
  yearsToSaveStarterDownPayment,
  type Verdict,
} from "../comparator-engine";
import type { OccupationSummary, OccupationWageSeries } from "./types";

export type OccupationMeasureId = "used_car" | "groceries" | "home" | "land";

/** Effort to afford one thing, in this occupation's working time, in the benchmark year and today. */
export interface OccupationMeasure {
  id: OccupationMeasureId;
  label: string;
  unit: "hours" | "minutes" | "years";
  then: number;
  now: number;
}

export interface OccupationComparison {
  occupation: OccupationSummary;
  source: string;
  thenYear: number;
  nowYear: number;
  annualWageThen: number;
  annualWageNow: number;
  wageGrowthPct: number;
  priceGrowthPct: number;
  /** Wage growth after inflation (CPI-U). */
  realWageChangePct: number;
  measures: OccupationMeasure[];
  /** Geometric mean of now / then effort across the measures; above 1 means harder today. */
  burdenIndex: number;
  buyingPowerDeltaPct: number;
  verdict: Verdict;
}

interface OccupationComparisonRequest {
  series: OccupationWageSeries;
  metrics: MetricsTable;
  thenYear: number;
}

const growthPct = (from: number, to: number) => (to / from - 1) * 100;

function annualWageIn(series: OccupationWageSeries, year: number): number {
  const wage = series.annualWageByYear.get(year);
  if (wage === undefined) throw new MissingMetricsYearError(year);
  return wage;
}

type MeasureDefinition = Omit<OccupationMeasure, "then" | "now"> & {
  effort: (metrics: YearlyMetrics, annualWage: number) => number;
};

const hourlyFrom = (annualWage: number) => annualWage / FULL_TIME_HOURS_PER_YEAR;

/** The same purchases the story deck prices, measured in this occupation's work. */
const MEASURES: readonly MeasureDefinition[] = [
  {
    id: "used_car",
    label: "Used car",
    unit: "hours",
    effort: (metrics, wage) => metrics.avgUsedCarPrice / hourlyFrom(wage),
  },
  {
    id: "groceries",
    label: "Milk and eggs",
    unit: "minutes",
    effort: (metrics, wage) => laborMinutes(groceryBasketPrice(metrics), hourlyFrom(wage)),
  },
  {
    id: "home",
    label: "Starter-home down payment",
    unit: "years",
    effort: (metrics, wage) => yearsToSaveStarterDownPayment(metrics.medianHomePrice, wage),
  },
  {
    id: "land",
    label: "Quarter-acre lot",
    unit: "hours",
    effort: (metrics, wage) => quarterAcreLotCost(metrics) / hourlyFrom(wage),
  },
];

/** Compares one occupation's buying power in `thenYear` with today's, like the deck does for a person. */
export function compareOccupation({ series, metrics, thenYear }: OccupationComparisonRequest): OccupationComparison {
  const then = metricsFor(metrics, thenYear);
  const now = metricsFor(metrics, CURRENT_YEAR);
  const annualWageThen = annualWageIn(series, thenYear);
  const annualWageNow = annualWageIn(series, CURRENT_YEAR);
  const measures = MEASURES.map(({ effort, ...measure }) => ({
    ...measure,
    then: effort(then, annualWageThen),
    now: effort(now, annualWageNow),
  }));
  const burdenIndex = geometricMean(measures.map((measure) => measure.now / measure.then));
  const realWageRatio = annualWageNow / now.cpiIndex / (annualWageThen / then.cpiIndex);
  return {
    occupation: series.occupation,
    source: series.source,
    thenYear,
    nowYear: CURRENT_YEAR,
    annualWageThen,
    annualWageNow,
    wageGrowthPct: growthPct(annualWageThen, annualWageNow),
    priceGrowthPct: growthPct(then.cpiIndex, now.cpiIndex),
    realWageChangePct: (realWageRatio - 1) * 100,
    measures,
    burdenIndex,
    buyingPowerDeltaPct: (1 / burdenIndex - 1) * 100,
    verdict: verdictFor(burdenIndex),
  };
}
