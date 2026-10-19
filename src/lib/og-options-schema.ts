import { z } from "zod";
import { OG_FORMATS, type OgFormat, type OgOptions } from "./og-card-params";
import { STORY_LENGTH } from "./story-content";

const FORMAT_NAMES = Object.keys(OG_FORMATS) as [OgFormat, ...OgFormat[]];

export const ogOptionsSchema = z.object({
  card: z.coerce
    .number({ error: "card must be a number" })
    .int("card must be a whole number")
    .min(1, `card must be between 1 and ${STORY_LENGTH}`)
    .max(STORY_LENGTH, `card must be between 1 and ${STORY_LENGTH}`)
    .default(STORY_LENGTH),
  fmt: z.enum(FORMAT_NAMES, { error: "fmt must be story or social" }).default("story"),
}) satisfies z.ZodType<OgOptions, unknown>;
