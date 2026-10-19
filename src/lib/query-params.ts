import { comparatorInputSchema, type ComparatorInput } from "./comparator-engine";

export type SearchParams = Record<string, string | string[] | undefined>;

/** Short URL keys keep share links compact: `/?by=1996&inc=65000&mode=parent_peer`. */
const QUERY_KEYS = {
  birthYear: "by",
  income: "inc",
  comparisonMode: "mode",
  customBenchmarkYear: "year",
} as const satisfies Record<keyof ComparatorInput, string>;

export type ComparatorField = keyof typeof QUERY_KEYS;
export type FieldErrors = Partial<Record<ComparatorField, string>>;

export type ComparisonQuery =
  | { status: "empty" }
  | { status: "invalid"; fieldErrors: FieldErrors; submitted: Partial<Record<ComparatorField, string>> }
  | { status: "valid"; input: ComparatorInput };

function firstValue(value: string | string[] | undefined): string | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  return single === "" ? undefined : single;
}

function isComparatorField(key: PropertyKey): key is ComparatorField {
  return typeof key === "string" && key in QUERY_KEYS;
}

export function parseComparisonQuery(params: SearchParams): ComparisonQuery {
  const submitted = Object.fromEntries(
    Object.entries(QUERY_KEYS).map(([field, key]) => [field, firstValue(params[key])]),
  ) as Partial<Record<ComparatorField, string>>;
  if (submitted.birthYear === undefined && submitted.income === undefined) return { status: "empty" };

  const result = comparatorInputSchema.safeParse(submitted);
  if (result.success) return { status: "valid", input: result.data };

  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const [field] = issue.path;
    if (isComparatorField(field)) fieldErrors[field] ??= issue.message;
  }
  return { status: "invalid", fieldErrors, submitted };
}
