import { z } from "zod";
import { COMPARISON_MODES, type ComparatorInput } from "./comparator-engine";

/** Kept apart from the engine so client components can use the engine without bundling zod. */
export const comparatorInputSchema = z
  .object({
    birthYear: z.coerce
      .number({ error: "Enter your birth year" })
      .int("Enter a whole year, like 1996")
      .min(1945, "Birth year must be 1945 or later")
      .max(2008, "Birth year must be 2008 or earlier"),
    income: z.coerce
      .number({ error: "Enter your annual income" })
      .min(1_000, "Income must be at least $1,000")
      .max(10_000_000, "Income must be $10,000,000 or less"),
    comparisonMode: z.enum(COMPARISON_MODES, { error: "Pick a comparison" }).default("parent_peer"),
    customBenchmarkYear: z.coerce
      .number({ error: "Enter a year" })
      .int("Enter a whole year")
      .min(1900, "Pick a year after 1900")
      .max(2100, "Pick a year before 2100")
      .optional(),
  })
  .refine((input) => input.comparisonMode !== "custom" || input.customBenchmarkYear !== undefined, {
    message: "Pick a year to compare against",
    path: ["customBenchmarkYear"],
  }) satisfies z.ZodType<ComparatorInput, unknown>;
