import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { IndustryExplorer } from "@/components/industries/IndustryExplorer";
import type { SearchParams } from "@/lib/query-params";
import { occupationComparisonQuerySchema } from "@/lib/industry/comparison-query";
import { getOccupationComparison, listOccupations } from "@/lib/industry/service";
import { DEFAULT_INDUSTRY_THEN_YEAR } from "@/lib/industry/then-years";

export const metadata: Metadata = { title: "Parity: industries, then and now" };

export default async function IndustriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const occupations = await listOccupations();
  const query = occupationComparisonQuerySchema.safeParse(await searchParams);
  // A missing, unknown or out-of-range choice falls back to the first job in the 1980s.
  const requested = query.success && occupations.some((occupation) => occupation.id === query.data.occupation) ? query.data : null;
  const initialComparison = await getOccupationComparison({
    occupationId: requested?.occupation ?? occupations[0].id,
    thenYear: requested?.then ?? DEFAULT_INDUSTRY_THEN_YEAR,
  });
  if (!initialComparison) throw new Error(`No comparison for the first listed occupation, ${occupations[0].id}`);

  return (
    <main className="min-h-[100dvh] bg-page">
      <div className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <SiteHeader current="/industries" />
        <h1 className="mt-8 text-3xl leading-tight font-semibold tracking-tighter text-balance md:text-4xl">
          The same job, decades apart
        </h1>
        <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-ink-muted">
          What a car, groceries, a home deposit and land cost in one job&apos;s working time, then and now.
        </p>
        <div className="mt-10">
          <IndustryExplorer occupations={occupations} initialComparison={initialComparison} />
        </div>
      </div>
    </main>
  );
}
