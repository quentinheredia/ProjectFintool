import { ImageResponse } from "@vercel/og";
import { SEED_METRICS_TABLE } from "@/data/seed-metrics-table";
import { compareGenerations } from "@/lib/comparator-engine";
import { OG_FORMATS, ogOptionsSchema } from "@/lib/og-card-params";
import { parseComparisonQuery } from "@/lib/query-params";
import { buildStorySlides } from "@/lib/story-content";
import { OgCard } from "./og-card";

export const runtime = "edge";

/** The dataset is bundled and only changes on deploy, so a rendered card never changes for a given URL. */
const CACHE_CONTROL = "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400";

const loadFont = (url: URL) => fetch(url).then((response) => response.arrayBuffer());

// Each URL must be a string literal: bundlers resolve `new URL(literal, import.meta.url)` statically,
// and a template string silently resolves every font to the same file.
const fontsPromise = Promise.all([
  loadFont(new URL("./fonts/Geist-Regular.ttf", import.meta.url)),
  loadFont(new URL("./fonts/Geist-SemiBold.ttf", import.meta.url)),
  loadFont(new URL("./fonts/GeistMono-Regular.ttf", import.meta.url)),
]);

function badRequest(fieldErrors: Record<string, string | undefined>): Response {
  return Response.json({ error: "Invalid card request", fieldErrors }, { status: 400 });
}

export async function GET(request: Request): Promise<Response> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = parseComparisonQuery(params);
  if (query.status === "empty") return badRequest({ birthYear: "by is required", income: "inc is required" });
  if (query.status === "invalid") return badRequest(query.fieldErrors);

  const options = ogOptionsSchema.safeParse(params);
  if (!options.success) {
    return badRequest(Object.fromEntries(options.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
  }

  const { card, fmt } = options.data;
  const result = compareGenerations(query.input, SEED_METRICS_TABLE);
  const slide = buildStorySlides(result)[card - 1];
  const [regular, semiBold, mono] = await fontsPromise;

  return new ImageResponse(<OgCard slide={slide} result={result} format={fmt} />, {
    ...OG_FORMATS[fmt],
    fonts: [
      { name: "Geist", data: regular, weight: 400, style: "normal" },
      { name: "Geist", data: semiBold, weight: 600, style: "normal" },
      { name: "GeistMono", data: mono, weight: 400, style: "normal" },
    ],
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
