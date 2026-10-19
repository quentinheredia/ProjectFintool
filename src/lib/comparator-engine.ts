import { FIRST_DATA_YEAR, type MetricsTable, type YearlyMetrics } from "@/data/yearly-metrics";

export const CURRENT_YEAR = 2026;
const LATEST_BENCHMARK_YEAR = CURRENT_YEAR - 1;
/** A parent's assumed age at the user's birth when the parent's birth year is not given. */
export const DEFAULT_PARENT_AGE_GAP = 30;

export const FULL_TIME_HOURS_PER_YEAR = 2080;
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

export const EMPLOYMENT_STATUSES = ["working", "student", "not_working"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

/** A validated comparison request; parse untrusted input with `comparatorInputSchema` first. */
export interface ComparatorInput {
  birthYear: number;
  /** Unknown parents are assumed born DEFAULT_PARENT_AGE_GAP years before the user. */
  parentBirthYear?: number;
  /** Defaults to "working". */
  employment?: EmploymentStatus;
  /** Annual income, or the expected one for a student. Not working always uses full-time minimum wage. */
  income?: number;
  /** Students only: the year they expect to start working. */
  workStartYear?: number;
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
  /** The parent's birth year as given, or assumed from DEFAULT_PARENT_AGE_GAP. */
  parentBirthYear: number;
  /** The parent's age in the benchmark year. */
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
  /** Counted from today, so it includes `yearsUntilWorking`. */
  yearsToSaveNow: number;
  yearsUntilWorking: number;
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
    /** As given; `parentBirthYear` on the resolution is the one used. */
    givenParentBirthYear?: number;
    employment: EmploymentStatus;
    workStartYear?: number;
    yearsUntilWorking: number;
    /** The annual income every card uses, after the not-working fallback. */
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
  income: number;
  userHourlyWage: number;
  yearsUntilWorking: number;
  then: YearlyMetrics;
  now: YearlyMetrics;
}

export class MissingMetricsYearError extends Error {
  constructor(year: number) {
    super(`No yearly metrics available for ${year}`);
    this.name = "MissingMetricsYearError";
  }
}

const parentBirthYearOf = (input: ComparatorInput) => input.parentBirthYear ?? input.birthYear - DEFAULT_PARENT_AGE_GAP;
/** The year the parent was the age the user is today. */
const parentAtUserAge = (input: ComparatorInput) => parentBirthYearOf(input) + CURRENT_YEAR - input.birthYear;

const BENCHMARK_YEAR_BY_MODE: Record<ComparisonMode, (input: ComparatorInput) => number> = {
  parent_peer: parentAtUserAge,
  age_25: (input) => parentBirthYearOf(input) + 25,
  age_30: (input) => parentBirthYearOf(input) + 30,
  custom: (input) => input.customBenchmarkYear ?? parentAtUserAge(input),
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const toPercent = (fraction: number) => fraction * 100;
const growthPct = (from: number, to: number) => toPercent((to - from) / from);
export const geometricMean = (values: number[]) => values.reduce((product, value) => product * value, 1) ** (1 / values.length);

export function resolveBenchmark(input: ComparatorInput): BenchmarkResolution {
  const requestedBenchmarkYear = BENCHMARK_YEAR_BY_MODE[input.comparisonMode](input);
  const benchmarkYear = clamp(requestedBenchmarkYear, FIRST_DATA_YEAR, LATEST_BENCHMARK_YEAR);
  const parentBirthYear = parentBirthYearOf(input);
  return {
    benchmarkYear,
    requestedBenchmarkYear,
    clampedYear: benchmarkYear === requestedBenchmarkYear ? null : benchmarkYear,
    userAge: CURRENT_YEAR - input.birthYear,
    parentBirthYear,
    benchmarkAge: benchmarkYear - parentBirthYear,
  };
}

export const minimumWageAnnualIncome = (metrics: YearlyMetrics) => metrics.federalMinWage * FULL_TIME_HOURS_PER_YEAR;

/** Not working counts as full-time minimum wage; everyone else brings their own (or expected) income. */
function resolveAnnualIncome(input: ComparatorInput, now: YearlyMetrics): number {
  if (input.employment === "not_working" || input.income === undefined) return minimumWageAnnualIncome(now);
  return input.income;
}

/** Counting starts today, so a student who starts working later waits that long before saving. */
function yearsUntilWorking({ employment, workStartYear }: ComparatorInput): number {
  if (employment !== "student" || workStartYear === undefined) return 0;
  return Math.max(workStartYear - CURRENT_YEAR, 0);
}

export function verdictFor(burdenRatio: number): Verdict {
  const isHarder = burdenRatio > PARITY_BURDEN_RATIO;
  let aura: Aura = "emerald";
  if (burdenRatio > SEVERE_BURDEN_RATIO) aura = "crimson";
  else if (isHarder) aura = "amber";
  return { burdenRatio, direction: isHarder ? "harder" : "easier", aura };
}

export function metricsFor(table: MetricsTable, year: number): YearlyMetrics {
  const metrics = table.get(year);
  if (!metrics) throw new MissingMetricsYearError(year);
  return metrics;
}

function buildDollarValueCard({ income, then, now }: ComparisonContext): DollarValueCard {
  const priceLevelRatio = then.cpiIndex / now.cpiIndex;
  const realPurchasingPowerRatio = income / now.cpiIndex / (then.medianIncome / then.cpiIndex);
  const cpiParitySalary = then.medianIncome / priceLevelRatio;
  return {
    id: 1,
    kind: "dollar_value",
    dollarValueLossPct: toPercent(1 - priceLevelRatio),
    equivalentPastSalary: income * priceLevelRatio,
    realPurchasingPowerRatio,
    cpiParitySalary,
    cpiParityGap: income - cpiParitySalary,
    benchmarkMedianIncome: then.medianIncome,
    verdict: verdictFor(1 / realPurchasingPowerRatio),
  };
}

export function yearsToSaveStarterDownPayment(medianHomePrice: number, annualIncome: number): number {
  const downPayment = DOWN_PAYMENT_RATE * STARTER_HOME_SHARE_OF_MEDIAN * medianHomePrice;
  return downPayment / (ANNUAL_SAVINGS_RATE * annualIncome);
}

function buildHousingCard({ income, yearsUntilWorking, then, now }: ComparisonContext): HousingCard {
  const yearsToSaveThen = yearsToSaveStarterDownPayment(then.medianHomePrice, then.medianIncome);
  const yearsToSaveNow = yearsUntilWorking + yearsToSaveStarterDownPayment(now.medianHomePrice, income);
  return {
    id: 2,
    kind: "housing",
    yearsToSaveThen,
    yearsToSaveNow,
    yearsUntilWorking,
    extraYearsRequired: yearsToSaveNow - yearsToSaveThen,
    housingParitySalary: now.medianHomePrice * (then.medianIncome / then.medianHomePrice),
    priceToIncomeThen: then.medianHomePrice / then.medianIncome,
    priceToIncomeNow: now.medianHomePrice / income,
    verdict: verdictFor(yearsToSaveNow / yearsToSaveThen),
  };
}

export const laborMinutes = (price: number, hourlyWage: number) => (price / hourlyWage) * MINUTES_PER_HOUR;
export const groceryBasketPrice = (metrics: YearlyMetrics) => metrics.milkGallonPrice + metrics.eggsDozenPrice;
export const quarterAcreLotCost = (metrics: YearlyMetrics) => LOT_SIZE_ACRES * metrics.medianLandAcrePrice;

function buildGroceryCard({ userHourlyWage, then, now }: ComparisonContext): GroceryCard {
  const basketThen = groceryBasketPrice(then);
  const basketNow = groceryBasketPrice(now);
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
  const lotCostThen = quarterAcreLotCost(then);
  const lotCostNow = quarterAcreLotCost(now);
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
  const input: ComparatorInput = { birthYear: meta.birthYear, comparisonMode: meta.comparisonMode };
  if (meta.givenParentBirthYear !== undefined) input.parentBirthYear = meta.givenParentBirthYear;
  if (meta.employment !== "working") input.employment = meta.employment;
  if (meta.employment !== "not_working") input.income = meta.income;
  if (meta.workStartYear !== undefined) input.workStartYear = meta.workStartYear;
  if (meta.comparisonMode === "custom") input.customBenchmarkYear = meta.requestedBenchmarkYear;
  return input;
}

/** Defaults stay out of the URL, so the common link is still `/?by=1996&inc=65000&mode=parent_peer`. */
export function buildSharePath(input: ComparatorInput): string {
  return `/?${comparisonQueryString(input)}`;
}

/** The sandbox opened on the same comparison as a story. */
export function buildSandboxPath(input: ComparatorInput): string {
  return `/sandbox?${comparisonQueryString(input)}`;
}

function comparisonQueryString(input: ComparatorInput): string {
  const params = new URLSearchParams({ by: String(input.birthYear) });
  if (input.employment !== "not_working" && input.income !== undefined) params.set("inc", String(input.income));
  params.set("mode", input.comparisonMode);
  if (input.comparisonMode === "custom" && input.customBenchmarkYear !== undefined) {
    params.set("year", String(input.customBenchmarkYear));
  }
  if (input.parentBirthYear !== undefined) params.set("pb", String(input.parentBirthYear));
  if (input.employment && input.employment !== "working") params.set("emp", input.employment);
  if (input.employment === "student" && input.workStartYear !== undefined) {
    params.set("start", String(input.workStartYear));
  }
  return params.toString();
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
  const now = metricsFor(table, CURRENT_YEAR);
  const income = resolveAnnualIncome(input, now);
  const context: ComparisonContext = {
    income,
    userHourlyWage: income / FULL_TIME_HOURS_PER_YEAR,
    yearsUntilWorking: yearsUntilWorking(input),
    then: metricsFor(table, benchmark.benchmarkYear),
    now,
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
      givenParentBirthYear: input.parentBirthYear,
      employment: input.employment ?? "working",
      workStartYear: input.employment === "student" ? input.workStartYear : undefined,
      yearsUntilWorking: context.yearsUntilWorking,
      income,
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
