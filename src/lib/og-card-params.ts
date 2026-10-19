import { z } from "zod";
import { buildSharePath, type ComparatorInput } from "./comparator-engine";
import { STORY_LENGTH } from "./story-content";

export const OG_FORMATS = {
  story: { width: 1080, height: 1920 },
  social: { width: 1200, height: 630 },
} as const;

export type OgFormat = keyof typeof OG_FORMATS;

export const OG_CARD_PATH = "/api/og/card";

export const ogOptionsSchema = z.object({
  card: z.coerce
    .number({ error: "card must be a number" })
    .int("card must be a whole number")
    .min(1, `card must be between 1 and ${STORY_LENGTH}`)
    .max(STORY_LENGTH, `card must be between 1 and ${STORY_LENGTH}`)
    .default(STORY_LENGTH),
  fmt: z.enum(["story", "social"], { error: "fmt must be story or social" }).default("story"),
});

export type OgOptions = z.output<typeof ogOptionsSchema>;

/** `/api/og/card?by=1996&inc=65000&mode=parent_peer&card=2&fmt=story`, reusing the share-link query keys. */
export function buildOgImagePath(input: ComparatorInput, { card, fmt }: OgOptions): string {
  const sharePath = buildSharePath(input);
  const params = new URLSearchParams(sharePath.slice(sharePath.indexOf("?") + 1));
  params.set("card", String(card));
  params.set("fmt", fmt);
  return `${OG_CARD_PATH}?${params}`;
}
