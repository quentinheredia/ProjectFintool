import { z } from "zod";
import { DEFAULT_INDUSTRY_THEN_YEAR, INDUSTRY_THEN_YEAR_RANGE } from "./then-years";

/** Server only: `/api/industries/compare?occupation=gov_it&then=1985`. */
export const occupationComparisonQuerySchema = z.object({
  occupation: z.string({ error: "occupation is required" }).min(1, "occupation is required"),
  then: z.coerce
    .number({ error: "then must be a year" })
    .int("then must be a whole year")
    .min(INDUSTRY_THEN_YEAR_RANGE.min, `then must be ${INDUSTRY_THEN_YEAR_RANGE.min} or later`)
    .max(INDUSTRY_THEN_YEAR_RANGE.max, `then must be ${INDUSTRY_THEN_YEAR_RANGE.max} or earlier`)
    .default(DEFAULT_INDUSTRY_THEN_YEAR),
});
