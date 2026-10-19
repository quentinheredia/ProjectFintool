import { z } from "zod";
import { COMPARISON_MODES, EMPLOYMENT_STATUSES, type ComparatorInput } from "./comparator-engine";
import { BIRTH_YEAR_RANGE, INCOME_RANGE, PARENT_AGE_GAP_RANGE, WORK_START_YEAR_RANGE } from "./input-limits";

const usd = (amount: number) => `$${amount.toLocaleString("en-US")}`;

const year = (required: string) => z.coerce.number({ error: required }).int("Enter a whole year, like 1996");

/** Kept apart from the engine so client components can use the engine without bundling zod. */
export const comparatorInputSchema = z
  .object({
    birthYear: year("Enter your birth year")
      .min(BIRTH_YEAR_RANGE.min, `Birth year must be ${BIRTH_YEAR_RANGE.min} or later`)
      .max(BIRTH_YEAR_RANGE.max, `Birth year must be ${BIRTH_YEAR_RANGE.max} or earlier`),
    parentBirthYear: year("Enter a year").optional(),
    employment: z.enum(EMPLOYMENT_STATUSES, { error: "Pick what you do now" }).default("working"),
    income: z.coerce
      .number({ error: "Enter your annual income" })
      .min(INCOME_RANGE.min, `Income must be at least ${usd(INCOME_RANGE.min)}`)
      .max(INCOME_RANGE.max, `Income must be ${usd(INCOME_RANGE.max)} or less`)
      .optional(),
    workStartYear: year("Enter a year")
      .min(WORK_START_YEAR_RANGE.min, `Pick ${WORK_START_YEAR_RANGE.min} or later`)
      .max(WORK_START_YEAR_RANGE.max, `Pick ${WORK_START_YEAR_RANGE.max} or earlier`)
      .optional(),
    comparisonMode: z.enum(COMPARISON_MODES, { error: "Pick a comparison" }).default("parent_peer"),
    customBenchmarkYear: z.coerce
      .number({ error: "Enter a year" })
      .int("Enter a whole year")
      .min(1900, "Pick a year after 1900")
      .max(2100, "Pick a year before 2100")
      .optional(),
  })
  .superRefine((input, context) => {
    const issue = (path: keyof ComparatorInput, message: string) => context.addIssue({ code: "custom", path: [path], message });
    if (input.employment !== "not_working" && input.income === undefined) {
      issue("income", input.employment === "student" ? "Enter the income you expect" : "Enter your annual income");
    }
    if (input.employment === "student" && input.workStartYear === undefined) {
      issue("workStartYear", "Enter the year you expect to start working");
    }
    if (input.parentBirthYear !== undefined) {
      const gap = input.birthYear - input.parentBirthYear;
      if (gap < PARENT_AGE_GAP_RANGE.min || gap > PARENT_AGE_GAP_RANGE.max) {
        issue("parentBirthYear", `Should be ${PARENT_AGE_GAP_RANGE.min} to ${PARENT_AGE_GAP_RANGE.max} years before yours`);
      }
    }
    if (input.comparisonMode === "custom" && input.customBenchmarkYear === undefined) {
      issue("customBenchmarkYear", "Pick a year to compare against");
    }
  })
  // Fields that do not apply to the chosen status are dropped, so they never reach the engine or the share link.
  .transform(({ income, workStartYear, ...input }): ComparatorInput => ({
    ...input,
    ...(input.employment !== "not_working" && { income }),
    ...(input.employment === "student" && { workStartYear }),
  })) satisfies z.ZodType<ComparatorInput, unknown>;
