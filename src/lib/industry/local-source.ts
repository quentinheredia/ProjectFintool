import { OCCUPATION_CATALOG, type OccupationCatalogEntry } from "@/data/occupations";
import type { MetricsTable } from "@/data/yearly-metrics";
import { FULL_TIME_HOURS_PER_YEAR } from "../comparator-engine";
import type { IndustryDataSource, OccupationSummary, OccupationWageSeries } from "./types";

const PLACEHOLDER_SOURCE = "Sample data: modeled as a fixed multiple of the BLS national average wage";

const toSummary = ({ id, label, sector }: OccupationCatalogEntry): OccupationSummary => ({
  id,
  label,
  sector,
  status: "placeholder",
});

function modeledAnnualWages(entry: OccupationCatalogEntry, metrics: MetricsTable): Map<number, number> {
  return new Map(
    [...metrics.values()].map((row) => [row.year, row.avgHourlyWage * entry.wageToNationalAverage * FULL_TIME_HOURS_PER_YEAR]),
  );
}

/** Serves the bundled catalog, modeling each occupation's wages from the national series in `metrics`. */
export function createLocalIndustrySource(metrics: MetricsTable): IndustryDataSource {
  return {
    async listOccupations() {
      return OCCUPATION_CATALOG.map(toSummary);
    },
    async getWageSeries(occupationId): Promise<OccupationWageSeries | null> {
      const entry = OCCUPATION_CATALOG.find((candidate) => candidate.id === occupationId);
      if (!entry) return null;
      return { occupation: toSummary(entry), source: PLACEHOLDER_SOURCE, annualWageByYear: modeledAnnualWages(entry, metrics) };
    },
  };
}
