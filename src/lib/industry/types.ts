/** "placeholder" is modeled sample data the UI must label; "observed" is a measured series. */
export type OccupationDataStatus = "placeholder" | "observed";

export interface OccupationSummary {
  id: string;
  label: string;
  sector: string;
  status: OccupationDataStatus;
}

export interface OccupationWageSeries {
  occupation: OccupationSummary;
  /** Printed under every comparison built from this series. */
  source: string;
  /** Mean annual wage per year, nominal USD. */
  annualWageByYear: ReadonlyMap<number, number>;
}

/**
 * Where occupation wages come from. The local source serves the bundled catalog today; a database-backed
 * source (Supabase) implements the same contract, and nothing above it changes.
 */
export interface IndustryDataSource {
  listOccupations(): Promise<OccupationSummary[]>;
  getWageSeries(occupationId: string): Promise<OccupationWageSeries | null>;
}
