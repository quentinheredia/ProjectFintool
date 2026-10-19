import { describe, expect, it } from "vitest";
import { SEED_METRICS_TABLE } from "@/data/seed-metrics-table";
import { compareGenerations, type ComparatorInput } from "@/lib/comparator-engine";
import { logAnonymousQuery, toAnonymousQueryRow } from "../anonymous-queries";

const input: ComparatorInput = { birthYear: 1990, income: 72_500.5, comparisonMode: "age_25" };

describe("toAnonymousQueryRow", () => {
  it("records birth year, the benchmark peer's age and income as a numeric string", () => {
    const { meta } = compareGenerations(input, SEED_METRICS_TABLE);
    expect(toAnonymousQueryRow(input, meta)).toEqual({ birthYear: 1990, benchmarkAge: 25, userIncome: "72500.50" });
  });
});

describe("logAnonymousQuery", () => {
  it("resolves without a database configured", async () => {
    await expect(logAnonymousQuery({ birthYear: 1990, benchmarkAge: 25, userIncome: "1000.00" })).resolves.toBeUndefined();
  });
});
