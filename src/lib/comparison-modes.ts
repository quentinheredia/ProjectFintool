import type { ComparisonMode } from "./comparator-engine";

export const COMPARISON_MODE_LABELS: Record<ComparisonMode, string> = {
  parent_peer: "Parents at your age",
  age_25: "Parents at 25",
  age_30: "Parents at 30",
  custom: "Pick a year",
};
