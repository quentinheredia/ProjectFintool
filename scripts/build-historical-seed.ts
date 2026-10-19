/**
 * Regenerates src/data/historical-seed.ts from live FRED series plus documented anchor tables.
 *
 * Methodology:
 * - FRED monthly/weekly/quarterly series are averaged per calendar year. A series' first year is
 *   dropped when it starts mid-year; the final year (LAST_DATA_YEAR) is a year-to-date average.
 * - `medianIncome` is BLS median usual weekly earnings of full-time wage & salary workers
 *   (LEU0252881500A) x 52. Users enter a full-time salary, so this is the like-for-like peer; Census
 *   median personal income (MEPAINUSA646N) includes part-time, student and retiree incomes.
 * - Federal minimum wage uses the statutory rate in effect at year end.
 * - Gallon milk before 1996 is spliced from the BLS half-gallon series, scaled at the overlap year.
 *   Grocery prices before BLS average-price coverage (1980) are interpolated from BLS retail food
 *   price anchors. Median earnings before 1979 are backcast, and the current year
 *   projected, with average hourly earnings (AHETPI).
 * - Series with no FRED equivalent are interpolated log-linearly between published anchor points
 *   (see the ANCHORS tables) and should be read as estimates.
 * - `isEstimate` marks the current, still-incomplete year.
 *
 * Run: npm run data:build
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { FIRST_DATA_YEAR, LAST_DATA_YEAR, type YearlyMetrics } from "../src/data/yearly-metrics";

const WEEKS_PER_YEAR = 52;
const FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=";
const OUTPUT_PATH = resolve(__dirname, "../src/data/historical-seed.ts");

type YearSeries = Map<number, number>;
type AnchorTable = Readonly<Record<number, number>>;

interface Observation {
  year: number;
  month: number;
  value: number;
}

/** Average transaction price of a used vehicle (NADA / Manheim / Edmunds / Cox Automotive). */
const USED_CAR_ANCHORS: AnchorTable = {
  1965: 1050, 1970: 1400, 1975: 2450, 1980: 3850, 1985: 5800, 1990: 7200, 1995: 10500,
  2000: 13300, 2005: 14800, 2010: 15800, 2015: 18700, 2019: 21400, 2020: 22900,
  2021: 26500, 2022: 28600, 2023: 28000, 2024: 26800, 2025: 26500, 2026: 26700,
};

/** Average transaction price of a new light vehicle (NADA / BEA / Kelley Blue Book). */
const NEW_CAR_ANCHORS: AnchorTable = {
  1965: 2650, 1970: 3450, 1975: 4950, 1980: 7570, 1985: 11450, 1990: 15900, 1995: 19450,
  2000: 24750, 2005: 28400, 2010: 29200, 2015: 33500, 2019: 37600, 2020: 39600,
  2021: 43600, 2022: 47400, 2023: 48500, 2024: 48400, 2025: 49800, 2026: 50800,
};

/** Public 4-year tuition, fees, room & board, current dollars (NCES Digest Table 330.10). */
const TUITION_ANCHORS: AnchorTable = {
  1965: 1050, 1970: 1360, 1975: 1935, 1980: 2550, 1985: 3860, 1990: 5070, 1995: 6740,
  2000: 8650, 2005: 12110, 2010: 15920, 2015: 19190, 2020: 21340, 2022: 21870,
  2024: 23250, 2025: 24000, 2026: 24700,
};

/** Residential developed-lot value per acre (Lincoln Institute / FHFA land-value research / NAHB lot values). */
const LAND_ACRE_ANCHORS: AnchorTable = {
  1965: 9000, 1970: 11500, 1975: 17000, 1980: 30000, 1985: 40000, 1990: 52000, 1995: 60000,
  2000: 80000, 2005: 140000, 2007: 160000, 2010: 120000, 2012: 115000, 2015: 160000,
  2018: 200000, 2020: 215000, 2022: 265000, 2024: 280000, 2026: 290000,
};

/** Average effective labor-market exit age, men and women averaged (Boston College CRR / OECD). */
const RETIREMENT_AGE_ANCHORS: AnchorTable = {
  1965: 65.8, 1970: 64.6, 1975: 63.6, 1980: 63.0, 1985: 62.6, 1990: 62.3, 1995: 62.0,
  2000: 62.4, 2005: 62.9, 2010: 63.5, 2015: 64.1, 2020: 64.6, 2026: 65.0,
};

/** Pre-1980 retail food prices (BLS "Retail Food Prices" bulletins / USDA ERS). */
const MILK_GALLON_ANCHORS: AnchorTable = { 1965: 0.95, 1970: 1.15, 1975: 1.57 };
const EGGS_DOZEN_ANCHORS: AnchorTable = { 1965: 0.53, 1970: 0.61, 1975: 0.77 };
const GROUND_BEEF_LB_ANCHORS: AnchorTable = { 1965: 0.5, 1970: 0.66, 1975: 0.88 };

/** 30-year contract mortgage rates before Freddie Mac's PMMS begins (FHLBB / Fed historical tables). */
const PRE_PMMS_MORTGAGE_RATES: AnchorTable = {
  1965: 5.81, 1966: 6.25, 1967: 6.46, 1968: 6.97, 1969: 7.81, 1970: 8.45, 1971: 7.54,
};

async function fetchFredObservations(seriesId: string): Promise<Observation[]> {
  const response = await fetch(FRED_CSV_URL + seriesId);
  if (!response.ok) throw new Error(`FRED ${seriesId}: HTTP ${response.status}`);
  const dataLines = (await response.text()).trim().split(/\r?\n/).slice(1);
  return dataLines.flatMap((line) => {
    const [date, rawValue] = line.split(",");
    const value = Number.parseFloat(rawValue);
    if (Number.isNaN(value)) return [];
    const [year, month] = date.split("-").map(Number);
    return [{ year, month, value }];
  });
}

function annualAverages(observations: Observation[]): YearSeries {
  const valuesByYear = new Map<number, number[]>();
  for (const { year, value } of observations) {
    valuesByYear.set(year, [...(valuesByYear.get(year) ?? []), value]);
  }
  const averages: YearSeries = new Map(
    [...valuesByYear].map(([year, values]) => [year, values.reduce((a, b) => a + b, 0) / values.length]),
  );
  const [firstObservation] = observations;
  const startsMidYear = firstObservation.month !== 1;
  if (startsMidYear) averages.delete(firstObservation.year);
  return averages;
}

function yearEndValues(observations: Observation[]): YearSeries {
  return new Map(observations.map(({ year, value }) => [year, value]));
}

function backcastWithIndex(series: YearSeries, index: YearSeries): YearSeries {
  const earliestYear = Math.min(...series.keys());
  const anchorValue = series.get(earliestYear)!;
  const anchorIndex = index.get(earliestYear)!;
  const filled = new Map(series);
  for (let year = FIRST_DATA_YEAR; year < earliestYear; year++) {
    filled.set(year, anchorValue * (index.get(year)! / anchorIndex));
  }
  return filled;
}

function spliceOlderSeries(series: YearSeries, older: YearSeries): YearSeries {
  const overlapYear = Math.min(...series.keys());
  const scale = series.get(overlapYear)! / older.get(overlapYear)!;
  const spliced = new Map(series);
  for (const [year, value] of older) {
    if (year < overlapYear) spliced.set(year, value * scale);
  }
  return spliced;
}

function fillEarlyYearsFromAnchors(series: YearSeries, anchors: AnchorTable): YearSeries {
  const earliestYear = Math.min(...series.keys());
  const bridge = interpolateAnchors({ ...anchors, [earliestYear]: series.get(earliestYear)! });
  const filled = new Map(series);
  for (const [year, value] of bridge) {
    if (year < earliestYear) filled.set(year, value);
  }
  return filled;
}

function projectWithIndex(series: YearSeries, index: YearSeries): YearSeries {
  const latestYear = Math.max(...series.keys());
  const anchorValue = series.get(latestYear)!;
  const anchorIndex = index.get(latestYear)!;
  const filled = new Map(series);
  for (let year = latestYear + 1; year <= LAST_DATA_YEAR; year++) {
    filled.set(year, anchorValue * (index.get(year)! / anchorIndex));
  }
  return filled;
}

function interpolateAnchors(anchors: AnchorTable): YearSeries {
  const anchorYears = Object.keys(anchors).map(Number).sort((a, b) => a - b);
  const series: YearSeries = new Map();
  for (let i = 0; i < anchorYears.length - 1; i++) {
    const startYear = anchorYears[i];
    const endYear = anchorYears[i + 1];
    const annualGrowth = (anchors[endYear] / anchors[startYear]) ** (1 / (endYear - startYear));
    for (let year = startYear; year < endYear; year++) {
      series.set(year, anchors[startYear] * annualGrowth ** (year - startYear));
    }
  }
  const lastAnchorYear = anchorYears[anchorYears.length - 1];
  series.set(lastAnchorYear, anchors[lastAnchorYear]);
  return series;
}

function withOverrides(series: YearSeries, overrides: AnchorTable): YearSeries {
  const merged = new Map(series);
  for (const [year, value] of Object.entries(overrides)) merged.set(Number(year), value);
  return merged;
}

function valueFor(series: YearSeries, year: number, label: string): number {
  const value = series.get(year);
  if (value === undefined) throw new Error(`Missing ${label} for ${year}`);
  return value;
}

const roundTo = (value: number, decimals: number) => Number(value.toFixed(decimals));

async function buildRows(): Promise<YearlyMetrics[]> {
  const [weeklyEarnings, cpi, hourly, minWage, homePrice, milk, milkHalfGallon, eggs, beef, mortgage] = await Promise.all(
    [
      "LEU0252881500A", "CPIAUCSL", "AHETPI", "FEDMINNFRWG", "MSPUS",
      "APU0000709112", "APU0000709111", "APU0000708111", "APU0000703111", "MORTGAGE30US",
    ].map(fetchFredObservations),
  );

  const hourlyWage = annualAverages(hourly);
  const annualEarnings: YearSeries = new Map(
    [...yearEndValues(weeklyEarnings)].map(([year, weekly]) => [year, weekly * WEEKS_PER_YEAR]),
  );
  const milkGallon = spliceOlderSeries(annualAverages(milk), annualAverages(milkHalfGallon));
  const series = {
    medianIncome: projectWithIndex(backcastWithIndex(annualEarnings, hourlyWage), hourlyWage),
    medianHomePrice: annualAverages(homePrice),
    averageNewCar: interpolateAnchors(NEW_CAR_ANCHORS),
    avgUsedCarPrice: interpolateAnchors(USED_CAR_ANCHORS),
    averageTuition: interpolateAnchors(TUITION_ANCHORS),
    cpiIndex: annualAverages(cpi),
    federalMinWage: yearEndValues(minWage),
    avgHourlyWage: hourlyWage,
    milkGallonPrice: fillEarlyYearsFromAnchors(milkGallon, MILK_GALLON_ANCHORS),
    eggsDozenPrice: fillEarlyYearsFromAnchors(annualAverages(eggs), EGGS_DOZEN_ANCHORS),
    groundBeefLbPrice: fillEarlyYearsFromAnchors(annualAverages(beef), GROUND_BEEF_LB_ANCHORS),
    medianLandAcrePrice: interpolateAnchors(LAND_ACRE_ANCHORS),
    avgRetirementAge: interpolateAnchors(RETIREMENT_AGE_ANCHORS),
    mortgageRate30Yr: withOverrides(annualAverages(mortgage), PRE_PMMS_MORTGAGE_RATES),
  };

  const rows: YearlyMetrics[] = [];
  for (let year = FIRST_DATA_YEAR; year <= LAST_DATA_YEAR; year++) {
    const money = (name: keyof typeof series) => roundTo(valueFor(series[name], year, name), 2);
    rows.push({
      year,
      medianIncome: money("medianIncome"),
      medianHomePrice: money("medianHomePrice"),
      averageNewCar: money("averageNewCar"),
      avgUsedCarPrice: money("avgUsedCarPrice"),
      averageTuition: money("averageTuition"),
      cpiIndex: roundTo(valueFor(series.cpiIndex, year, "cpiIndex"), 3),
      federalMinWage: money("federalMinWage"),
      avgHourlyWage: money("avgHourlyWage"),
      milkGallonPrice: money("milkGallonPrice"),
      eggsDozenPrice: money("eggsDozenPrice"),
      groundBeefLbPrice: money("groundBeefLbPrice"),
      medianLandAcrePrice: money("medianLandAcrePrice"),
      avgRetirementAge: roundTo(valueFor(series.avgRetirementAge, year, "avgRetirementAge"), 1),
      mortgageRate30Yr: money("mortgageRate30Yr"),
      isEstimate: year === LAST_DATA_YEAR,
    });
  }
  return rows;
}

function renderModule(rows: YearlyMetrics[]): string {
  const body = rows
    .map((row) => `  { ${Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(", ")} },`)
    .join("\n");
  return `// Generated by scripts/build-historical-seed.ts. Do not edit by hand; run \`npm run data:build\`.
import type { YearlyMetrics } from "./yearly-metrics";

export const HISTORICAL_SEED: readonly YearlyMetrics[] = [
${body}
];
`;
}

buildRows()
  .then((rows) => {
    writeFileSync(OUTPUT_PATH, renderModule(rows));
    console.log(`Wrote ${rows.length} years to ${OUTPUT_PATH}`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
