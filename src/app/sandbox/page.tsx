import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Sandbox } from "@/components/sandbox/Sandbox";
import { getMetricsTable } from "@/db";
import { CURRENT_YEAR, metricsFor, minimumWageAnnualIncome } from "@/lib/comparator-engine";
import { parseComparisonQuery, type SearchParams } from "@/lib/query-params";
import { sampleComparisonInput } from "@/lib/sample-comparison";
import { wagePresets } from "@/lib/wage-presets";

export const metadata: Metadata = { title: "Parity sandbox" };

export default async function SandboxPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const table = await getMetricsTable();
  const now = metricsFor(table, CURRENT_YEAR);
  const sample = sampleComparisonInput(now);
  const query = parseComparisonQuery(await searchParams);
  // An invalid link still opens: the sandbox starts from the sample and every control is valid from there.
  const initialInput = query.status === "valid" ? query.input : sample;

  return (
    <main className="min-h-[100dvh] bg-page">
      <div className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <SiteHeader current="/sandbox" />
        <h1 className="mt-8 text-3xl leading-tight font-semibold tracking-tighter text-balance md:text-4xl">
          Your comparison, live
        </h1>
        <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-ink-muted">
          Change anything and every figure updates. When it looks right, play it as a story to share.
        </p>
        <div className="mt-10">
          <Sandbox
            initialInput={initialInput}
            metricsRows={[...table.values()]}
            wagePresets={wagePresets(now)}
            notWorkingIncome={minimumWageAnnualIncome(now)}
            fallbackIncome={sample.income}
          />
        </div>
      </div>
    </main>
  );
}
