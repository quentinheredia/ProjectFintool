import { buildSharePath, type ComparatorInput } from "./comparator-engine";

export const OG_FORMATS = {
  story: { width: 1080, height: 1920 },
  social: { width: 1200, height: 630 },
} as const;

export type OgFormat = keyof typeof OG_FORMATS;

export const OG_CARD_PATH = "/api/og/card";

export interface OgOptions {
  card: number;
  fmt: OgFormat;
}

/** `/api/og/card?by=1996&inc=65000&mode=parent_peer&card=2&fmt=story`, reusing the share-link query keys. */
export function buildOgImagePath(input: ComparatorInput, { card, fmt }: OgOptions): string {
  const sharePath = buildSharePath(input);
  const params = new URLSearchParams(sharePath.slice(sharePath.indexOf("?") + 1));
  params.set("card", String(card));
  params.set("fmt", fmt);
  return `${OG_CARD_PATH}?${params}`;
}
