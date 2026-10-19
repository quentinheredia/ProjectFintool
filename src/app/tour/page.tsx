import type { Metadata } from "next";
import { StoryCarousel } from "@/components/StoryCarousel";
import { getMetricsTable } from "@/db";
import { CURRENT_YEAR, compareGenerations, metricsFor } from "@/lib/comparator-engine";
import { sampleComparisonInput } from "@/lib/sample-comparison";
import { buildStorySlides } from "@/lib/story-content";

export const metadata: Metadata = { title: "Parity: a sample comparison" };

/** The guided first run: a median earner's story, ending on an invitation to try your own numbers. */
export default async function Tour() {
  const table = await getMetricsTable();
  const input = sampleComparisonInput(metricsFor(table, CURRENT_YEAR));
  const result = compareGenerations(input, table);
  return (
    <StoryCarousel
      result={result}
      slides={buildStorySlides(result)}
      finale={{ label: "Compare with your numbers", href: "/sandbox" }}
      note="Sample"
    />
  );
}
