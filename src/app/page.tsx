import type { Metadata } from "next";
import Link from "next/link";
import { ComparatorForm } from "@/components/ComparatorForm";
import { StoryCarousel } from "@/components/StoryCarousel";
import { StorySlide } from "@/components/story/StorySlide";
import { SEED_METRICS_TABLE } from "@/data/seed-metrics-table";
import { getMetricsTable } from "@/db";
import { buildSharePath, compareGenerations, type ComparatorInput } from "@/lib/comparator-engine";
import { parseComparisonQuery, type ComparisonQuery, type SearchParams } from "@/lib/query-params";
import { buildOgImagePath } from "@/lib/og-card-params";
import { buildStorySlides } from "@/lib/story-content";

const QUICK_TRIES: { label: string; input: ComparatorInput }[] = [
  { label: "Born 1996, $65K", input: { birthYear: 1996, income: 65_000, comparisonMode: "parent_peer" } },
  { label: "Born 1990, $450K", input: { birthYear: 1990, income: 450_000, comparisonMode: "parent_peer" } },
  { label: "Born 2003, minimum wage", input: { birthYear: 2003, income: 15_080, comparisonMode: "parent_peer" } },
];

const PREVIEW_INPUT = QUICK_TRIES[0].input;

function PreviewStack() {
  const result = compareGenerations(PREVIEW_INPUT, SEED_METRICS_TABLE);
  const [dollarSlide, housingSlide] = buildStorySlides(result);
  const frame = "absolute h-[600px] w-[338px] overflow-hidden rounded-3xl ring-1 ring-ink-faint";
  return (
    <div aria-hidden inert className="relative hidden h-[640px] w-[380px] justify-self-end lg:block">
      <div className={`${frame} top-0 right-0 rotate-[5deg] opacity-60`}>
        <StorySlide slide={dollarSlide} result={result} />
      </div>
      <div className={`${frame} top-6 right-10 -rotate-[3deg] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)]`}>
        <StorySlide slide={housingSlide} result={result} />
      </div>
    </div>
  );
}

function Landing({ query }: { query: Exclude<ComparisonQuery, { status: "valid" }> }) {
  const invalid = query.status === "invalid" ? query : undefined;
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-page">
      <div className="mx-auto grid min-h-[100dvh] max-w-6xl items-center gap-12 px-4 py-10 md:px-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p translate="no" className="text-lg font-semibold tracking-tight">
            Parity<span className="text-brand">.</span>
          </p>
          <h1 className="mt-10 max-w-[22ch] text-4xl leading-[1.04] text-balance font-semibold tracking-tighter md:text-5xl">
            How hard do you work for the life your parents had?
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-muted">
            Two inputs, seven cards. Your paycheck against a peer from 30 years ago, measured in hours worked.
          </p>

          <ComparatorForm fieldErrors={invalid?.fieldErrors} submitted={invalid?.submitted} />

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-ink-muted">Or try</span>
            {QUICK_TRIES.map((quickTry) => (
              <Link
                key={quickTry.label}
                href={buildSharePath(quickTry.input)}
                className="rounded-full bg-ink/[0.07] px-3.5 py-1.5 text-sm text-ink transition hover:bg-ink/15 focus-visible:outline-2 focus-visible:outline-brand active:scale-[0.98]"
              >
                {quickTry.label}
              </Link>
            ))}
          </div>
        </div>

        <PreviewStack />
      </div>
    </main>
  );
}

/** Shared result links unfurl as the summary card on X, iMessage, Slack and others. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const query = parseComparisonQuery(await searchParams);
  if (query.status !== "valid") return {};
  const image = { url: buildOgImagePath(query.input, { card: 7, fmt: "social" }), width: 1200, height: 630 };
  const title = `Born ${query.input.birthYear}: my buying power vs my parents'`;
  return {
    title,
    openGraph: { title, images: [image] },
    twitter: { card: "summary_large_image", title, images: [image] },
  };
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = parseComparisonQuery(await searchParams);
  if (query.status !== "valid") return <Landing query={query} />;

  const result = compareGenerations(query.input, await getMetricsTable());
  return <StoryCarousel key={buildSharePath(query.input)} result={result} slides={buildStorySlides(result)} />;
}
