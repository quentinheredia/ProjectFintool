import { getMetricsTable } from "@/db";
import type { MetricsTable } from "@/data/yearly-metrics";
import { createLocalIndustrySource } from "./local-source";
import { compareOccupation, type OccupationComparison } from "./occupation-comparison";
import type { IndustryDataSource, OccupationSummary } from "./types";

export interface OccupationComparisonQuery {
  occupationId: string;
  thenYear: number;
}

/** The one place that picks the data source; a Supabase-backed source replaces the local one here. */
function industrySourceFor(metrics: MetricsTable): IndustryDataSource {
  return createLocalIndustrySource(metrics);
}

export async function listOccupations(): Promise<OccupationSummary[]> {
  return industrySourceFor(await getMetricsTable()).listOccupations();
}

/** Null when the occupation is unknown. */
export async function getOccupationComparison({ occupationId, thenYear }: OccupationComparisonQuery): Promise<OccupationComparison | null> {
  const metrics = await getMetricsTable();
  const series = await industrySourceFor(metrics).getWageSeries(occupationId);
  return series && compareOccupation({ series, metrics, thenYear });
}
