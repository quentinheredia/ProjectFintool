export interface OccupationCatalogEntry {
  id: string;
  label: string;
  sector: string;
  /** Placeholder level: the occupation's wage as a multiple of the national average hourly wage. */
  wageToNationalAverage: number;
}

/**
 * PLACEHOLDER catalog. The multiples are illustrative, not measured. Until real occupation series are
 * loaded (BLS OEWS, CPS, OPM pay tables), each occupation is modeled as a fixed multiple of the national
 * average wage, so its trend is the national trend. Every comparison built from it is labelled sample data.
 */
export const OCCUPATION_CATALOG: readonly OccupationCatalogEntry[] = [
  { id: "gov_it", label: "Government IT specialist", sector: "Government", wageToNationalAverage: 1.4 },
  { id: "engineer", label: "Engineer", sector: "Engineering", wageToNationalAverage: 1.6 },
  { id: "software_developer", label: "Software developer", sector: "Tech", wageToNationalAverage: 1.9 },
  { id: "oil_gas_worker", label: "Oil and gas worker", sector: "Energy", wageToNationalAverage: 1.3 },
  { id: "k12_teacher", label: "K-12 teacher", sector: "Education", wageToNationalAverage: 1.05 },
];
