import { FIRST_DATA_YEAR, type MetricsTable, type YearlyMetrics } from "@/data/yearly-metrics";

export const CURRENT_YEAR = 2026;
const LATEST_BENCHMARK_YEAR = CURRENT_YEAR - 1;
const GENERATION_GAP_YEARS = 30;

const FULL_TIME_HOURS_PER_YEAR = 2080;
const MINUTES_PER_HOUR = 60;
const STARTER_HOME_SHARE_OF_MEDIAN = 0.8;
const DOWN_PAYMENT_RATE = 0.2;
const ANNUAL_SAVINGS_RATE = 0.15;
const LOT_SIZE_ACRES = 0.25;
const INDEX_BASE = 100;

/** A burden ratio above this (more than 25% harder than the benchmark) is a severe deficit. */
const SEVERE_BURDEN_RATIO = 1.25;
const PARITY_BURDEN_RATIO = 1;

export const COMPARISON_MODES = ["parent_peer", "age_25", "age_30", "custom"] as const;
export type ComparisonMode = (typeof COMPARISON_MODES)[number];

/** A validated comparison request; parse untrusted input with `comparatorInputSchema` first. */
export interface ComparatorInput {
  birthYear: number;
  income: number;
  comparisonMode: ComparisonMode;
  customBenchmarkYear?: number;
}

export type Aura = "crimson" | "amber" | "emerald";
export type Direction = "harder" | "easier";

/** `burdenRatio` is effort required today divided by effort required in the benchmark year. */
export interface Verdict {
  burdenRatio: number;
  direction: Direction;
  aura: Aura;
}

export interface BenchmarkResolution {
  benchmarkYear: number;
  requestedBenchmarkYear: number;
  /** The year actually used when the requested year fell outside the dataset, otherwise null. */
  clampedYear: number | null;
  userAge: number;
  /** Age of a parent-generation peer (born GENERATION_GAP_YEARS earlier) in the benchmark year. */
  benchmarkAge: number;
}

export interface DollarValueCard {
  id: 1;
  kind: "dollar_value";
  dollarValueLossPct: number;
  equivalentPastSalary: number;
  realPurchasingPowerRatio: number;
  /** Benchmark median income restated in today's dollars. */
  cpiParitySalary: number;
  cpiParityGap: number;
  benchmarkMedianIncome: number;
  verdict: Verdict;
}

export interface HousingCard {
  id: 2;
  kind: "housing";
  yearsToSaveThen: number;
  yearsToSaveNow: number;
  extraYearsRequired: number;
  housingParitySalary: number;
  priceToIncomeThen: number;
  priceToIncomeNow: number;
  verdict: Verdict;
}

export interface GroceryCard {
  id: 3;
  kind: "groceries";
  basketThen: number;
  basketNow: number;
  nominalMultiplier: number;
  minutesWorkedThen: number;
  minutesWorkedNowMedian: number;
  minutesWorkedNowUser: number;
  verdict: Verdict;
}

export interface LandCard {
  id: 4;
  kind: "land";
  lotCostThen: number;
  lotCostNow: number;
  hoursThen: number;
  hoursNowUser: number;
  effortReductionPctIfBornThen: number;
  verdict: Verdict;
}

export interface MinWageCarCard {
  id: 5;
  kind: "min_wage_car";
  minWageThen: number;
  minWageNow: number;
  usedCarThen: number;
  usedCarNow: number;
  minWageGrowthPct: number;
  usedCarGrowthPct: number;
  minWageHoursForUsedCarThen: number;
  minWageHoursForUsedCarNow: number;
  verdict: Verdict;
}

export interface RetirementCard {
  id: 6;
  kind: "retirement";
  retirementAgeThen: number;
  retirementAgeNow: number;
  yearsLost: number;
  verdict: Verdict;
}

export interface SummaryCard {
  id: 7;
  kind: "summary";
  priceToIncome: { then: number; now: number };
  housingParitySalary: number;
  minWageHoursForUsedCar: { then: number; now: number };
  groceryMultiplier: number;
  retirementYearsLost: number;
  /** Geometric mean of the user-specific burden ratios (cards 1–4). */
  overallBurdenIndex: number;
  /** Negative means a purchasing power deficit versus the benchmark; positive means a surplus. */
  purchasingPowerDeltaPct: number;
  sharePath: string;
  verdict: Verdict;
}

type DetailCards = [DollarValueCard, HousingCard, GroceryCard, LandCard, MinWageCarCard, RetirementCard];
export type StoryCards = [...DetailCards, SummaryCard];

export const WAGE_BASES = ["user", "median", "minimum"] as const;
export type WageBasis = (typeof WAGE_BASES)[number];
type WageTable = Record<WageBasis, number>;

export interface ReceiptLine {
  item: "milk" | "eggs" | "groundBeef";
  label: string;
  priceThen: number;
  priceNow: number;
  minutesThen: WageTable;
  minutesNow: WageTable;
}

export interface LaborReceipt {
  /** Hourly wage per basis. "user" in the benchmark year falls back to that year's average wage. */
  wagesThen: WageTable;
  wagesNow: WageTable;
  lines: ReceiptLine[];
}

export const DIVERGENCE_SERIES = ["minimumWage", "medianIncome", "usedCar", "homePrice"] as const;
export type DivergenceSeries = (typeof DIVERGENCE_SERIES)[number];
export type DivergencePoint = { year: number } & Record<DivergenceSeries, number>;

export interface ComparisonResult {
  meta: BenchmarkResolution & {
    currentYear: number;
    comparisonMode: ComparisonMode;
    birthYear: number;
    income: number;
    userHourlyWage: number;
    includesEstimates: boolean;
  };
  cards: StoryCards;
  charts: {
    laborReceipt: LaborReceipt;
    divergence: DivergencePoint[];
  };
}

type NumericMetricField = {
  [Field in keyof YearlyMetrics]: YearlyMetrics[Field] extends number ? Field : never;
}[keyof YearlyMetrics];

interface ComparisonContext {
  input: ComparatorInput;
  userHourlyWage: number;
  then: YearlyMetrics;
  now: YearlyMetrics;
}

export class MissingMetricsYearError extends Error {
  constructor(year: number) {
    super(`No yearly metrics available for ${year}`);
    this.name = "MissingMetricsYearError";
  }
}

const BENCHMARK_YEAR_BY_MODE: Record<ComparisonMode, (input: ComparatorInput) => number> = {
  parent_peer: () => CURRENT_YEAR - GENERATION_GAP_YEARS,
  age_25: ({ birthYear }) => birthYear - GENERATION_GAP_YEARS + 25,
  age_30: ({ birthYear }) => birthYear - GENERATION_GAP_YEARS + 30,
  custom: ({ customBenchmarkYear }) => customBenchmarkYear ?? CURRENT_YEAR - GENERATION_GAP_YEARS,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const toPercent = (fraction: number) => fraction * 100;
const growthPct = (from: number, to: number) => toPercent((to - from) / from);
const geometricMean = (values: number[]) => values.reduce((product, value) => product * value, 1) ** (1 / values.length);

export function resolveBenchmark(input: ComparatorInput): BenchmarkResolution {
  const requestedBenchmarkYear = BENCHMARK_YEAR_BY_MODE[input.comparisonMode](input);
  const benchmarkYear = clamp(requestedBenchmarkYear, FIRST_DATA_YEAR, LATEST_BENCHMARK_YEAR);
  const parentGenerationBirthYear = input.birthYear - GENERATION_GAP_YEARS;
  return {
    benchmarkYear,
    requestedBenchmarkYear,
    clampedYear: benchmarkYear === requestedBenchmarkYear ? null : benchmarkYear,
    userAge: CURRENT_YEAR - input.birthYear,
    benchmarkAge: benchmarkYear - parentGenerationBirthYear,
  };
}

export function verdictFor(burdenRatio: number): Verdict {
  const isHarder = burdenRatio > PARITY_BURDEN_RATIO;
  let aura: Aura = "emerald";
  if (burdenRatio > SEVERE_BURDEN_RATIO) aura = "crimson";
  else if (isHarder) aura = "amber";
  return { burdenRatio, direction: isHarder ? "harder" : "easier", aura };
}

function metricsFor(table: MetricsTable, year: number): YearlyMetrics {
  const metrics = table.get(year);
  if (!metrics) throw new MissingMetricsYearError(year);
  return metrics;
}

function buildDollarValueCard({ input, then, now }: ComparisonContext): DollarValueCard {
  const priceLevelRatio = then.cpiIndex / now.cpiIndex;
  const realPurchasingPowerRatio = input.income / now.cpiIndex / (then.medianIncome / then.cpiIndex);
  const cpiParitySalary = then.medianIncome / priceLevelRatio;
  return {
    id: 1,
    kind: "dollar_value",
    dollarValueLossPct: toPercent(1 - priceLevelRatio),
    equivalentPastSalary: input.income * priceLevelRatio,
    realPurchasingPowerRatio,
    cpiParitySalary,
    cpiParityGap: input.income - cpiParitySalary,
    benchmarkMedianIncome: then.medianIncome,
    verdict: verdictFor(1 / realPurchasingPowerRatio),
  };
}

function yearsToSaveStarterDownPayment(medianHomePrice: number, annualIncome: number): number {
  const downPayment = DOWN_PAYMENT_RATE * STARTER_HOME_SHARE_OF_MEDIAN * medianHomePrice;
  return downPayment / (ANNUAL_SAVINGS_RATE * annualIncome);
}

function buildHousingCard({ input, then, now }: ComparisonContext): HousingCard {
  const yearsToSaveThen = yearsToSaveStarterDownPayment(then.medianHomePrice, then.medianIncome);
  const yearsToSaveNow = yearsToSaveStarterDownPayment(now.medianHomePrice, input.income);
  return {
    id: 2,
    kind: "housing",
    yearsToSaveThen,
    yearsToSaveNow,
    extraYearsRequired: yearsToSaveNow - yearsToSaveThen,
    housingParitySalary: now.medianHomePrice * (then.medianIncome / then.medianHomePrice),
    priceToIncomeThen: then.medianHomePrice / then.medianIncome,
    priceToIncomeNow: now.medianHomePrice / input.income,
    verdict: verdictFor(yearsToSaveNow / yearsToSaveThen),
  };
}

const laborMinutes = (price: number, hourlyWage: number) => (price / hourlyWage) * MINUTES_PER_HOUR;

function buildGroceryCard({ userHourlyWage, then, now }: ComparisonContext): GroceryCard {
  const basketThen = then.milkGallonPrice + then.eggsDozenPrice;
  const basketNow = now.milkGallonPrice + now.eggsDozenPrice;
  const minutesWorkedThen = laborMinutes(basketThen, then.avgHourlyWage);
  const minutesWorkedNowUser = laborMinutes(basketNow, userHourlyWage);
  return {
    id: 3,
    kind: "groceries",
    basketThen,
    basketNow,
    nominalMultiplier: basketNow / basketThen,
    minutesWorkedThen,
    minutesWorkedNowMedian: laborMinutes(basketNow, now.avgHourlyWage),
    minutesWorkedNowUser,
    verdict: verdictFor(minutesWorkedNowUser / minutesWorkedThen),
  };
}

function buildLandCard({ userHourlyWage, then, now }: ComparisonContext): LandCard {
  const lotCostThen = LOT_SIZE_ACRES * then.medianLandAcrePrice;
  const lotCostNow = LOT_SIZE_ACRES * now.medianLandAcrePrice;
  const hoursThen = lotCostThen / (then.medianIncome / FULL_TIME_HOURS_PER_YEAR);
  const hoursNowUser = lotCostNow / userHourlyWage;
  return {
    id: 4,
    kind: "land",
    lotCostThen,
    lotCostNow,
    hoursThen,
    hoursNowUser,
    effortReductionPctIfBornThen: toPercent(1 - hoursThen / hoursNowUser),
    verdict: verdictFor(hoursNowUser / hoursThen),
  };
}

function buildMinWageCarCard({ then, now }: ComparisonContext): MinWageCarCard {
  const minWageHoursForUsedCarThen = then.avgUsedCarPrice / then.federalMinWage;
  const minWageHoursForUsedCarNow = now.avgUsedCarPrice / now.federalMinWage;
  return {
    id: 5,
    kind: "min_wage_car",
    minWageThen: then.federalMinWage,
    minWageNow: now.federalMinWage,
    usedCarThen: then.avgUsedCarPrice,
    usedCarNow: now.avgUsedCarPrice,
    minWageGrowthPct: growthPct(then.federalMinWage, now.federalMinWage),
    usedCarGrowthPct: growthPct(then.avgUsedCarPrice, now.avgUsedCarPrice),
    minWageHoursForUsedCarThen,
    minWageHoursForUsedCarNow,
    verdict: verdictFor(minWageHoursForUsedCarNow / minWageHoursForUsedCarThen),
  };
}

function buildRetirementCard({ then, now }: ComparisonContext): RetirementCard {
  return {
    id: 6,
    kind: "retirement",
    retirementAgeThen: then.avgRetirementAge,
    retirementAgeNow: now.avgRetirementAge,
    yearsLost: now.avgRetirementAge - then.avgRetirementAge,
    verdict: verdictFor(now.avgRetirementAge / then.avgRetirementAge),
  };
}

/** Recovers the original request from a result, e.g. to build share links on the client. */
export function inputFromMeta(meta: ComparisonResult["meta"]): ComparatorInput {
  const input: ComparatorInput = {
    birthYear: meta.birthYear,
    income: meta.income,
    comparisonMode: meta.comparisonMode,
  };
  return meta.comparisonMode === "custom" ? { ...input, customBenchmarkYear: meta.requestedBenchmarkYear } : input;
}

export function buildSharePath(input: ComparatorInput): string {
  const params = new URLSearchParams({
    by: String(input.birthYear),
    inc: String(input.income),
    mode: input.comparisonMode,
  });
  if (input.comparisonMode === "custom" && input.customBenchmarkYear !== undefined) {
    params.set("year", String(input.customBenchmarkYear));
  }
  return `/?${params}`;
}

function buildSummaryCard(
  input: ComparatorInput,
  [dollar, housing, groceries, land, minWageCar, retirement]: DetailCards,
): SummaryCard {
  const userSpecificBurdens = [dollar, housing, groceries, land].map((card) => card.verdict.burdenRatio);
  const overallBurdenIndex = geometricMean(userSpecificBurdens);
  return {
    id: 7,
    kind: "summary",
    priceToIncome: { then: housing.priceToIncomeThen, now: housing.priceToIncomeNow },
    housingParitySalary: housing.housingParitySalary,
    minWageHoursForUsedCar: {
      then: minWageCar.minWageHoursForUsedCarThen,
      now: minWageCar.minWageHoursForUsedCarNow,
    },
    groceryMultiplier: groceries.nominalMultiplier,
    retirementYearsLost: retirement.yearsLost,
    overallBurdenIndex,
    purchasingPowerDeltaPct: toPercent(1 / overallBurdenIndex - 1),
    sharePath: buildSharePath(input),
    verdict: verdictFor(overallBurdenIndex),
  };
}

function wageTables({ userHourlyWage, then, now }: ComparisonContext): { wagesThen: WageTable; wagesNow: WageTable } {
  return {
    wagesThen: { user: then.avgHourlyWage, median: then.avgHourlyWage, minimum: then.federalMinWage },
    wagesNow: { user: userHourlyWage, median: now.avgHourlyWage, minimum: now.federalMinWage },
  };
}

const RECEIPT_ITEMS = [
  { item: "milk", label: "Whole milk, 1 gal", priceField: "milkGallonPrice" },
  { item: "eggs", label: "Grade A eggs, 1 doz", priceField: "eggsDozenPrice" },
  { item: "groundBeef", label: "Ground beef, 1 lb", priceField: "groundBeefLbPrice" },
] as const satisfies readonly { item: ReceiptLine["item"]; label: string; priceField: NumericMetricField }[];

function minutesPerBasis(price: number, wages: WageTable): WageTable {
  return {
    user: laborMinutes(price, wages.user),
    median: laborMinutes(price, wages.median),
    minimum: laborMinutes(price, wages.minimum),
  };
}

function buildLaborReceipt(context: ComparisonContext): LaborReceipt {
  const { wagesThen, wagesNow } = wageTables(context);
  const lines = RECEIPT_ITEMS.map(({ item, label, priceField }) => {
    const priceThen = context.then[priceField];
    const priceNow = context.now[priceField];
    return {
      item,
      label,
      priceThen,
      priceNow,
      minutesThen: minutesPerBasis(priceThen, wagesThen),
      minutesNow: minutesPerBasis(priceNow, wagesNow),
    };
  });
  return { wagesThen, wagesNow, lines };
}

const DIVERGENCE_FIELDS: Record<DivergenceSeries, NumericMetricField> = {
  minimumWage: "federalMinWage",
  medianIncome: "medianIncome",
  usedCar: "avgUsedCarPrice",
  homePrice: "medianHomePrice",
};

function indexedValue(metrics: YearlyMetrics, base: YearlyMetrics, series: DivergenceSeries): number {
  const field = DIVERGENCE_FIELDS[series];
  return (metrics[field] / base[field]) * INDEX_BASE;
}

function buildDivergenceChart(table: MetricsTable, base: YearlyMetrics): DivergencePoint[] {
  const points: DivergencePoint[] = [];
  for (let year = base.year; year <= CURRENT_YEAR; year++) {
    const metrics = metricsFor(table, year);
    points.push({
      year,
      minimumWage: indexedValue(metrics, base, "minimumWage"),
      medianIncome: indexedValue(metrics, base, "medianIncome"),
      usedCar: indexedValue(metrics, base, "usedCar"),
      homePrice: indexedValue(metrics, base, "homePrice"),
    });
  }
  return points;
}

/** Computes the full 7-card story and chart payload. `input` must already be parsed by `comparatorInputSchema` (see comparator-input.ts). */
export function compareGenerations(input: ComparatorInput, table: MetricsTable): ComparisonResult {
  const benchmark = resolveBenchmark(input);
  const context: ComparisonContext = {
    input,
    userHourlyWage: input.income / FULL_TIME_HOURS_PER_YEAR,
    then: metricsFor(table, benchmark.benchmarkYear),
    now: metricsFor(table, CURRENT_YEAR),
  };
  const detailCards: DetailCards = [
    buildDollarValueCard(context),
    buildHousingCard(context),
    buildGroceryCard(context),
    buildLandCard(context),
    buildMinWageCarCard(context),
    buildRetirementCard(context),
  ];

  return {
    meta: {
      ...benchmark,
      currentYear: CURRENT_YEAR,
      comparisonMode: input.comparisonMode,
      birthYear: input.birthYear,
      income: input.income,
      userHourlyWage: context.userHourlyWage,
      includesEstimates: context.then.isEstimate || context.now.isEstimate,
    },
    cards: [...detailCards, buildSummaryCard(input, detailCards)],
    charts: {
      laborReceipt: buildLaborReceipt(context),
      divergence: buildDivergenceChart(table, context.then),
    },
  };
}
