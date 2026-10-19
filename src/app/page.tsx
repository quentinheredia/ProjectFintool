import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StoryCarousel } from "@/components/StoryCarousel";
import { StorySlide } from "@/components/story/StorySlide";
import { SEED_METRICS_TABLE } from "@/data/seed-metrics-table";
import { getMetricsTable } from "@/db";
import { logAnonymousQuery, toAnonymousQueryRow } from "@/db/anonymous-queries";
import { CURRENT_YEAR, buildSandboxPath, buildSharePath, compareGenerations } from "@/lib/comparator-engine";
import { buildOgImagePath } from "@/lib/og-card-params";
import { parseComparisonQuery, type SearchParams } from "@/lib/query-params";
import { sampleComparisonInput } from "@/lib/sample-comparison";
import { buildStorySlides } from "@/lib/story-content";

const introStep = (step: number) => ({ "--intro-step": step }) as CSSProperties;

function PreviewStack() {
  const result = compareGenerations(sampleComparisonInput(SEED_METRICS_TABLE.get(CURRENT_YEAR)!), SEED_METRICS_TABLE);
  const [dollarSlide, housingSlide] = buildStorySlides(result);
  const frame = "intro-deal absolute h-[600px] w-[338px] overflow-hidden rounded-3xl ring-1 ring-ink-faint";
  return (
    <div aria-hidden inert className="relative hidden h-[640px] w-[380px] justify-self-end lg:block">
      <div className="intro-glow absolute -inset-24 rounded-full bg-[radial-gradient(closest-side,rgba(255,51,102,0.18),transparent)]" />
      <div className={`${frame} top-0 right-0 rotate-[5deg] opacity-40 blur-[1px]`} style={introStep(0)}>
        <StorySlide slide={dollarSlide} result={result} />
      </div>
      <div
        className={`${frame} top-6 right-10 -rotate-[3deg] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)]`}
        style={introStep(1)}
      >
        <StorySlide slide={housingSlide} result={result} />
      </div>
    </div>
  );
}

function Landing() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-page">
      <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 md:px-8">
        <div className="intro-rise" style={introStep(0)}>
          <SiteHeader />
        </div>
        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <h1
              className="intro-rise max-w-[22ch] text-4xl leading-[1.04] text-balance font-semibold tracking-tighter md:text-6xl"
              style={introStep(1)}
            >
              How hard do you work for the life your parents had?
            </h1>
            <p className="intro-rise mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-muted" style={introStep(2)}>
              A home, groceries, land and a car, priced in hours of work: you today against your parent at your age.
            </p>
            <div className="intro-rise mt-10" style={introStep(3)}>
              <Link
                href="/tour"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-base font-semibold whitespace-nowrap text-page transition hover:bg-[#ff4d7a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
              >
                See the comparison
                <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
          </div>
          <PreviewStack />
        </div>
      </div>
    </main>
  );
}

function toQueryString(params: SearchParams): string {
  const entries = Object.entries(params).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value]).filter((item) => item !== undefined).map((item) => [key, item]),
  );
  return new URLSearchParams(entries as [string, string][]).toString();
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
  const params = await searchParams;
  const query = parseComparisonQuery(params);
  if (query.status === "empty") return <Landing />;
  // A broken link lands in the sandbox, where every input is a control that cannot be invalid.
  if (query.status === "invalid") redirect(`/sandbox?${toQueryString(params)}`);

  const result = compareGenerations(query.input, await getMetricsTable());
  const queryRow = toAnonymousQueryRow(query.input, result.meta);
  after(() => logAnonymousQuery(queryRow));
  return (
    <StoryCarousel
      key={buildSharePath(query.input)}
      result={result}
      slides={buildStorySlides(result)}
      finale={{ label: "Open in the sandbox", href: buildSandboxPath(query.input) }}
    />
  );
}
