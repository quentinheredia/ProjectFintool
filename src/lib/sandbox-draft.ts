import type { ComparatorInput, ComparisonMode, EmploymentStatus } from "./comparator-engine";
import { INCOME_RANGE, PARENT_AGE_GAP_RANGE, WORK_START_YEAR_RANGE } from "./input-limits";

const DEFAULT_CUSTOM_BENCHMARK_YEAR = 1985;

/** The sandbox's controls. Every field but the income text is a choice that cannot be invalid. */
export interface SandboxDraft {
  birthYear: number;
  /** Null means "not sure": the engine assumes the default parent age gap. */
  parentBirthYear: number | null;
  employment: EmploymentStatus;
  /** What the income field shows, possibly mid-edit and out of range. */
  incomeText: string;
  /** The last in-range income; the results use it while the text is being edited. */
  income: number;
  workStartYear: number;
  comparisonMode: ComparisonMode;
  customBenchmarkYear: number;
}

export const digitsOnly = (value: string) => value.replace(/\D/g, "");
export const groupThousands = (digits: string) => (digits ? Number(digits).toLocaleString("en-US") : "");

export const isIncomeInRange = (income: number) => income >= INCOME_RANGE.min && income <= INCOME_RANGE.max;

export function parentBirthYearOptions(birthYear: number): number[] {
  const newest = birthYear - PARENT_AGE_GAP_RANGE.min;
  return Array.from({ length: PARENT_AGE_GAP_RANGE.max - PARENT_AGE_GAP_RANGE.min + 1 }, (_, index) => newest - index);
}

export function draftFromInput(input: ComparatorInput, fallbackIncome: number): SandboxDraft {
  const income = input.income ?? fallbackIncome;
  return {
    birthYear: input.birthYear,
    parentBirthYear: input.parentBirthYear ?? null,
    employment: input.employment ?? "working",
    incomeText: String(income),
    income,
    workStartYear: input.workStartYear ?? WORK_START_YEAR_RANGE.min + 1,
    comparisonMode: input.comparisonMode,
    customBenchmarkYear: input.customBenchmarkYear ?? DEFAULT_CUSTOM_BENCHMARK_YEAR,
  };
}

/** A new birth year keeps the chosen parent year only while it is still a possible one. */
export function withBirthYear(draft: SandboxDraft, birthYear: number): SandboxDraft {
  const keepsParent = draft.parentBirthYear !== null && parentBirthYearOptions(birthYear).includes(draft.parentBirthYear);
  return { ...draft, birthYear, parentBirthYear: keepsParent ? draft.parentBirthYear : null };
}

export function withIncomeText(draft: SandboxDraft, text: string): SandboxDraft {
  const digits = digitsOnly(text).slice(0, String(INCOME_RANGE.max).length);
  const typed = Number(digits);
  return { ...draft, incomeText: digits, income: digits && isIncomeInRange(typed) ? typed : draft.income };
}

export function inputFromDraft(draft: SandboxDraft): ComparatorInput {
  const input: ComparatorInput = { birthYear: draft.birthYear, comparisonMode: draft.comparisonMode };
  if (draft.parentBirthYear !== null) input.parentBirthYear = draft.parentBirthYear;
  if (draft.employment !== "working") input.employment = draft.employment;
  if (draft.employment !== "not_working") input.income = draft.income;
  if (draft.employment === "student") input.workStartYear = draft.workStartYear;
  if (draft.comparisonMode === "custom") input.customBenchmarkYear = draft.customBenchmarkYear;
  return input;
}
