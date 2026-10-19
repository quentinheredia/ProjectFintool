import { describe, expect, it } from "vitest";
import { SEED_METRICS_TABLE } from "@/data/seed-metrics-table";
import { CURRENT_YEAR, MissingMetricsYearError } from "../comparator-engine";
import { createLocalIndustrySource } from "../industry/local-source";
import { compareOccupation } from "../industry/occupation-comparison";
import { occupationComparisonQuerySchema } from "../industry/comparison-query";

const source = createLocalIndustrySource(SEED_METRICS_TABLE);

async function seriesFor(occupationId: string) {
  const series = await source.getWageSeries(occupationId);
  if (!series) throw new Error(`missing ${occupationId}`);
  return series;
}

describe("local industry source", () => {
  it("lists every occupation as placeholder data", async () => {
    const occupations = await source.listOccupations();
    expect(occupations.map((occupation) => occupation.id)).toContain("gov_it");
    expect(occupations.every((occupation) => occupation.status === "placeholder")).toBe(true);
  });

  it("returns null for an unknown occupation", async () => {
    expect(await source.getWageSeries("astronaut")).toBeNull();
  });

  it("models a wage for every year of metrics", async () => {
    expect((await seriesFor("engineer")).annualWageByYear.size).toBe(SEED_METRICS_TABLE.size);
  });
});

describe("compareOccupation", () => {
  it("prices each measure in the occupation's own working time", async () => {
    const series = await seriesFor("gov_it");
    const comparison = compareOccupation({ series, metrics: SEED_METRICS_TABLE, thenYear: 1985 });
    const now = SEED_METRICS_TABLE.get(CURRENT_YEAR)!;
    const hourlyNow = comparison.annualWageNow / 2080;
    const usedCar = comparison.measures.find((measure) => measure.id === "used_car")!;
    expect(usedCar.now).toBeCloseTo(now.avgUsedCarPrice / hourlyNow);
    expect(comparison.measures.map((measure) => measure.id)).toEqual(["used_car", "groceries", "home", "land"]);
  });

  it("derives buying power and the verdict from the same burden index", async () => {
    const series = await seriesFor("k12_teacher");
    const comparison = compareOccupation({ series, metrics: SEED_METRICS_TABLE, thenYear: 1975 });
    expect(comparison.buyingPowerDeltaPct).toBeCloseTo((1 / comparison.burdenIndex - 1) * 100);
    expect(comparison.verdict.burdenRatio).toBe(comparison.burdenIndex);
  });

  it("throws for a year outside the series", async () => {
    const series = await seriesFor("engineer");
    expect(() => compareOccupation({ series, metrics: SEED_METRICS_TABLE, thenYear: 1950 })).toThrow(MissingMetricsYearError);
  });
});

describe("occupationComparisonQuerySchema", () => {
  it("defaults the then year to 1985", () => {
    expect(occupationComparisonQuerySchema.parse({ occupation: "gov_it" })).toEqual({ occupation: "gov_it", then: 1985 });
  });

  it.each([{}, { occupation: "gov_it", then: "1964" }, { occupation: "gov_it", then: String(CURRENT_YEAR) }])(
    "rejects %o",
    (raw) => {
      expect(occupationComparisonQuerySchema.safeParse(raw).success).toBe(false);
    },
  );
});
