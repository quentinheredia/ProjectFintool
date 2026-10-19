import { describe, expect, it } from "vitest";
import { HISTORICAL_SEED } from "@/data/historical-seed";
import { SEED_METRICS_TABLE } from "@/data/seed-metrics-table";
import { FIRST_DATA_YEAR, LAST_DATA_YEAR, toMetricsTable, type YearlyMetrics } from "@/data/yearly-metrics";
import {
  COMPARISON_MODES,
  CURRENT_YEAR,
  MissingMetricsYearError,
  buildSharePath,
  compareGenerations,
  comparatorInputSchema,
  resolveBenchmark,
  verdictFor,
  type ComparatorInput,
  type ComparisonMode,
} from "../comparator-engine";

const BENCHMARK_ROW: Omit<YearlyMetrics, "year"> = {
  medianIncome: 20_000,
  medianHomePrice: 100_000,
  averageNewCar: 20_000,
  avgUsedCarPrice: 10_000,
  averageTuition: 7_000,
  cpiIndex: 150,
  federalMinWage: 5,
  avgHourlyWage: 10,
  milkGallonPrice: 2.5,
  eggsDozenPrice: 1.5,
  groundBeefLbPrice: 2,
  medianLandAcrePrice: 40_000,
  avgRetirementAge: 62,
  mortgageRate30Yr: 8,
  isEstimate: false,
};

const CURRENT_ROW: Omit<YearlyMetrics, "year"> = {
  medianIncome: 50_000,
  medianHomePrice: 400_000,
  averageNewCar: 50_000,
  avgUsedCarPrice: 30_000,
  averageTuition: 25_000,
  cpiIndex: 300,
  federalMinWage: 7.5,
  avgHourlyWage: 30,
  milkGallonPrice: 4,
  eggsDozenPrice: 3,
  groundBeefLbPrice: 6,
  medianLandAcrePrice: 200_000,
  avgRetirementAge: 65,
  mortgageRate30Yr: 6.5,
  isEstimate: true,
};

/** Every year equals the benchmark row except CURRENT_YEAR, so expected values are hand-computable. */
const FIXTURE_TABLE = toMetricsTable(
  Array.from({ length: LAST_DATA_YEAR - FIRST_DATA_YEAR + 1 }, (_, offset) => {
    const year = FIRST_DATA_YEAR + offset;
    return { year, ...(year === CURRENT_YEAR ? CURRENT_ROW : BENCHMARK_ROW) };
  }),
);

function collectNumbers(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectNumbers);
}

function input(overrides: Partial<ComparatorInput> = {}): ComparatorInput {
  return { birthYear: 1996, income: 65_000, comparisonMode: "parent_peer", ...overrides };
}

const fixtureResult = compareGenerations(input(), FIXTURE_TABLE);
const [dollar, housing, groceries, land, minWageCar, retirement, summary] = fixtureResult.cards;

describe("comparatorInputSchema", () => {
  it("coerces query-string values and defaults the comparison mode", () => {
    expect(comparatorInputSchema.parse({ birthYear: "1996", income: "65000" })).toEqual({
      birthYear: 1996,
      income: 65_000,
      comparisonMode: "parent_peer",
    });
  });

  it.each([
    ["birth year below range", { birthYear: 1944, income: 65_000 }],
    ["birth year above range", { birthYear: 2009, income: 65_000 }],
    ["fractional birth year", { birthYear: 1996.5, income: 65_000 }],
    ["income below minimum", { birthYear: 1996, income: 999 }],
    ["income above maximum", { birthYear: 1996, income: 10_000_001 }],
    ["non-numeric income", { birthYear: 1996, income: "lots" }],
    ["unknown comparison mode", { birthYear: 1996, income: 65_000, comparisonMode: "age_40" }],
    ["custom mode without a year", { birthYear: 1996, income: 65_000, comparisonMode: "custom" }],
  ])("rejects %s", (_, raw) => {
    expect(comparatorInputSchema.safeParse(raw).success).toBe(false);
  });

  it.each([
    { birthYear: 1945, income: 1_000 },
    { birthYear: 2008, income: 10_000_000 },
  ])("accepts inclusive boundaries %o", (raw) => {
    expect(comparatorInputSchema.safeParse(raw).success).toBe(true);
  });
});

describe("resolveBenchmark", () => {
  it.each<[ComparisonMode, number]>([
    ["parent_peer", 1996],
    ["age_25", 1985],
    ["age_30", 1990],
  ])("resolves %s for a 1990 birth year to %i", (comparisonMode, expectedYear) => {
    expect(resolveBenchmark(input({ birthYear: 1990, comparisonMode })).benchmarkYear).toBe(expectedYear);
  });

  it("uses the custom year when it is inside the dataset", () => {
    const resolution = resolveBenchmark(input({ comparisonMode: "custom", customBenchmarkYear: 1980 }));
    expect(resolution).toMatchObject({ benchmarkYear: 1980, clampedYear: null });
  });

  it("clamps a custom year before the dataset to 1965 and reports it", () => {
    const resolution = resolveBenchmark(input({ comparisonMode: "custom", customBenchmarkYear: 1955 }));
    expect(resolution).toMatchObject({ benchmarkYear: 1965, requestedBenchmarkYear: 1955, clampedYear: 1965 });
  });

  it("clamps a benchmark of the current year back to the latest complete comparison year", () => {
    const resolution = resolveBenchmark(input({ comparisonMode: "custom", customBenchmarkYear: CURRENT_YEAR }));
    expect(resolution.clampedYear).toBe(CURRENT_YEAR - 1);
  });

  it("clamps the oldest birth year's age-25 benchmark (1940) to 1965", () => {
    expect(resolveBenchmark(input({ birthYear: 1945, comparisonMode: "age_25" })).benchmarkYear).toBe(1965);
  });

  it("reports user age and the parent-generation peer's age in the benchmark year", () => {
    expect(resolveBenchmark(input({ birthYear: 1990 }))).toMatchObject({ userAge: 36, benchmarkAge: 36 });
  });
});

describe("verdictFor", () => {
  it.each([
    [2, "harder", "crimson"],
    [1.26, "harder", "crimson"],
    [1.25, "harder", "amber"],
    [1.01, "harder", "amber"],
    [1, "easier", "emerald"],
    [0.4, "easier", "emerald"],
  ])("maps burden ratio %d to %s / %s", (burdenRatio, direction, aura) => {
    expect(verdictFor(burdenRatio)).toEqual({ burdenRatio, direction, aura });
  });
});

describe("compareGenerations formulas (fixture data)", () => {
  it("card 1 computes CPI erosion, the equivalent past salary and real purchasing power", () => {
    expect(dollar.dollarValueLossPct).toBeCloseTo(50);
    expect(dollar.equivalentPastSalary).toBeCloseTo(32_500);
    expect(dollar.realPurchasingPowerRatio).toBeCloseTo(1.625);
    expect(dollar.cpiParitySalary).toBeCloseTo(40_000);
    expect(dollar.cpiParityGap).toBeCloseTo(25_000);
  });

  it("card 2 computes starter-home down-payment saving years and the housing parity salary", () => {
    expect(housing.yearsToSaveThen).toBeCloseTo(16_000 / 3_000);
    expect(housing.yearsToSaveNow).toBeCloseTo(64_000 / 9_750);
    expect(housing.extraYearsRequired).toBeCloseTo(64_000 / 9_750 - 16_000 / 3_000);
    expect(housing.housingParitySalary).toBeCloseTo(80_000);
    expect(housing.priceToIncomeThen).toBeCloseTo(5);
    expect(housing.priceToIncomeNow).toBeCloseTo(400_000 / 65_000);
  });

  it("card 3 converts the milk & eggs basket into labor minutes", () => {
    expect(groceries.basketThen).toBeCloseTo(4);
    expect(groceries.basketNow).toBeCloseTo(7);
    expect(groceries.nominalMultiplier).toBeCloseTo(1.75);
    expect(groceries.minutesWorkedThen).toBeCloseTo(24);
    expect(groceries.minutesWorkedNowMedian).toBeCloseTo(14);
    expect(groceries.minutesWorkedNowUser).toBeCloseTo(13.44);
  });

  it("card 4 computes quarter-acre work hours and the effort reduction", () => {
    expect(land.lotCostThen).toBeCloseTo(10_000);
    expect(land.hoursThen).toBeCloseTo(1_040);
    expect(land.hoursNowUser).toBeCloseTo(1_600);
    expect(land.effortReductionPctIfBornThen).toBeCloseTo(35);
  });

  it("card 5 computes minimum wage vs used car growth and hours", () => {
    expect(minWageCar.minWageGrowthPct).toBeCloseTo(50);
    expect(minWageCar.usedCarGrowthPct).toBeCloseTo(200);
    expect(minWageCar.minWageHoursForUsedCarThen).toBeCloseTo(2_000);
    expect(minWageCar.minWageHoursForUsedCarNow).toBeCloseTo(4_000);
  });

  it("card 6 computes the retirement age shift", () => {
    expect(retirement).toMatchObject({ retirementAgeThen: 62, retirementAgeNow: 65, yearsLost: 3 });
  });

  it("assigns each card the aura its burden ratio implies", () => {
    expect(fixtureResult.cards.map((card) => card.verdict.aura)).toEqual([
      "emerald",
      "amber",
      "emerald",
      "crimson",
      "crimson",
      "amber",
      "emerald",
    ]);
  });

  it("card 7 aggregates headline metrics and the overall burden index", () => {
    const expectedIndex = (1 / 1.625 * (64_000 / 9_750 / (16_000 / 3_000)) * (13.44 / 24) * (1_600 / 1_040)) ** 0.25;
    expect(summary.overallBurdenIndex).toBeCloseTo(expectedIndex);
    expect(summary.purchasingPowerDeltaPct).toBeCloseTo((1 / expectedIndex - 1) * 100);
    expect(summary).toMatchObject({
      housingParitySalary: housing.housingParitySalary,
      groceryMultiplier: groceries.nominalMultiplier,
      retirementYearsLost: 3,
      minWageHoursForUsedCar: { then: 2_000, now: 4_000 },
      sharePath: "/?by=1996&inc=65000&mode=parent_peer",
    });
  });

  it("flags results that rely on preliminary-year estimates", () => {
    expect(fixtureResult.meta.includesEstimates).toBe(true);
  });
});

describe("labor receipt chart", () => {
  const { laborReceipt } = fixtureResult.charts;

  it("lists milk, eggs and ground beef", () => {
    expect(laborReceipt.lines.map((line) => line.item)).toEqual(["milk", "eggs", "groundBeef"]);
  });

  it("prices every line in minutes for each wage basis", () => {
    const milk = laborReceipt.lines[0];
    expect(milk.minutesNow.user).toBeCloseTo((4 / 31.25) * 60);
    expect(milk.minutesNow.median).toBeCloseTo(8);
    expect(milk.minutesNow.minimum).toBeCloseTo(32);
    expect(milk.minutesThen.minimum).toBeCloseTo(30);
  });

  it("uses the benchmark average wage as the 'user' wage in the benchmark year", () => {
    expect(laborReceipt.wagesThen.user).toBe(BENCHMARK_ROW.avgHourlyWage);
  });
});

describe("divergence chart", () => {
  const { divergence } = fixtureResult.charts;

  it("spans every year from the benchmark to the current year", () => {
    expect(divergence.map((point) => point.year)).toEqual(Array.from({ length: 31 }, (_, i) => 1996 + i));
  });

  it("starts every series at 100", () => {
    expect(divergence[0]).toEqual({ year: 1996, minimumWage: 100, medianIncome: 100, usedCar: 100, homePrice: 100 });
  });

  it("ends each series at its cumulative growth index", () => {
    expect(divergence.at(-1)).toEqual({ year: 2026, minimumWage: 150, medianIncome: 250, usedCar: 300, homePrice: 400 });
  });
});

describe("buildSharePath", () => {
  it("includes the custom year only in custom mode", () => {
    expect(buildSharePath(input({ comparisonMode: "custom", customBenchmarkYear: 1980 }))).toBe(
      "/?by=1996&inc=65000&mode=custom&year=1980",
    );
  });
});

describe("missing data", () => {
  it("throws a MissingMetricsYearError when a required year is absent", () => {
    const withoutBenchmark = toMetricsTable(HISTORICAL_SEED.filter((row) => row.year !== 1996));
    expect(() => compareGenerations(input(), withoutBenchmark)).toThrow(MissingMetricsYearError);
  });
});

describe("compareGenerations on the historical seed", () => {
  it("covers every year from 1965 to 2026", () => {
    expect([...SEED_METRICS_TABLE.keys()]).toEqual(
      Array.from({ length: LAST_DATA_YEAR - FIRST_DATA_YEAR + 1 }, (_, i) => FIRST_DATA_YEAR + i),
    );
  });

  it("standard millennial ($65k, born 1996) needs more years to save for a home than a 1996 peer", () => {
    const [, seedHousing] = compareGenerations(input(), SEED_METRICS_TABLE).cards;
    expect(seedHousing.extraYearsRequired).toBeGreaterThan(0);
    expect(seedHousing.verdict.direction).toBe("harder");
  });

  it("high earner ($450k) flips housing to a surplus with the emerald aura", () => {
    const [, seedHousing] = compareGenerations(input({ income: 450_000 }), SEED_METRICS_TABLE).cards;
    expect(seedHousing.extraYearsRequired).toBeLessThan(0);
    expect(seedHousing.verdict).toMatchObject({ direction: "easier", aura: "emerald" });
  });

  it("high earner ($450k) shows an overall purchasing power surplus", () => {
    const summaryCard = compareGenerations(input({ income: 450_000 }), SEED_METRICS_TABLE).cards[6];
    expect(summaryCard.purchasingPowerDeltaPct).toBeGreaterThan(0);
  });

  it("full-time minimum wage worker spends the same grocery minutes as the minimum-wage receipt basis", () => {
    const minimumWage = SEED_METRICS_TABLE.get(CURRENT_YEAR)!.federalMinWage;
    const result = compareGenerations(input({ income: minimumWage * 2080 }), SEED_METRICS_TABLE);
    const milkLine = result.charts.laborReceipt.lines[0];
    expect(milkLine.minutesNow.user).toBeCloseTo(milkLine.minutesNow.minimum);
  });

  it("full-time minimum wage worker faces a severe (crimson) housing deficit", () => {
    const minimumWage = SEED_METRICS_TABLE.get(CURRENT_YEAR)!.federalMinWage;
    const [, seedHousing] = compareGenerations(input({ income: minimumWage * 2080 }), SEED_METRICS_TABLE).cards;
    expect(seedHousing.verdict.aura).toBe("crimson");
  });

  it("produces finite numbers for every birth year and comparison mode", () => {
    const nonFinite: string[] = [];
    for (let birthYear = 1945; birthYear <= 2008; birthYear++) {
      for (const comparisonMode of COMPARISON_MODES) {
        const raw = { birthYear, income: 1_000, comparisonMode, customBenchmarkYear: birthYear };
        const result = compareGenerations(comparatorInputSchema.parse(raw), SEED_METRICS_TABLE);
        if (!collectNumbers(result).every(Number.isFinite)) nonFinite.push(`${birthYear}/${comparisonMode}`);
      }
    }
    expect(nonFinite).toEqual([]);
  });
});
