import { describe, expect, it } from "vitest";
import { SEED_METRICS_TABLE } from "@/data/seed-metrics-table";
import { compareGenerations, inputFromMeta, type ComparatorInput } from "../comparator-engine";
import { buildOgImagePath, ogOptionsSchema } from "../og-card-params";

const customInput: ComparatorInput = {
  birthYear: 1990,
  income: 72_000,
  comparisonMode: "custom",
  customBenchmarkYear: 1980,
};

describe("buildOgImagePath", () => {
  it("reuses the share-link keys and appends card and format", () => {
    expect(buildOgImagePath(customInput, { card: 2, fmt: "story" })).toBe(
      "/api/og/card?by=1990&inc=72000&mode=custom&year=1980&card=2&fmt=story",
    );
  });
});

describe("ogOptionsSchema", () => {
  it("defaults to the summary card in story format", () => {
    expect(ogOptionsSchema.parse({})).toEqual({ card: 7, fmt: "story" });
  });

  it.each([{ card: "0" }, { card: "8" }, { card: "2.5" }, { fmt: "square" }])("rejects %o", (raw) => {
    expect(ogOptionsSchema.safeParse(raw).success).toBe(false);
  });
});

describe("inputFromMeta", () => {
  it("round-trips a custom comparison through the result metadata", () => {
    const { meta } = compareGenerations(customInput, SEED_METRICS_TABLE);
    expect(inputFromMeta(meta)).toEqual(customInput);
  });

  it("omits the custom year for preset modes", () => {
    const presetInput: ComparatorInput = { birthYear: 1996, income: 65_000, comparisonMode: "age_25" };
    expect(inputFromMeta(compareGenerations(presetInput, SEED_METRICS_TABLE).meta)).toEqual(presetInput);
  });
});
