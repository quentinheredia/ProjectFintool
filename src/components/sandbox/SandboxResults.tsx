import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buildSharePath, type ComparatorInput, type ComparisonResult } from "@/lib/comparator-engine";
import type { StorySlideContent } from "@/lib/story-content";
import { auraStyle } from "../story/CardShell";
import { MadLibsCopy } from "../story/MadLibsCopy";

const TILE_CLASS = "rounded-xl bg-aura p-5 ring-1 ring-ink-faint transition-colors duration-700";

function SummaryTile({ slide }: { slide: StorySlideContent }) {
  return (
    <article style={auraStyle(slide.aura)} className={`${TILE_CLASS} p-6 md:p-8`}>
      <h2 className="font-mono text-[11px] tracking-[0.14em] text-ink-muted uppercase">{slide.title}</h2>
      <p key={slide.heroStat} className="value-swap mt-4 text-6xl leading-none font-semibold tracking-tighter text-accent tabular-nums md:text-7xl">
        {slide.heroStat}
      </p>
      <p className="mt-2 text-base text-ink-muted">{slide.heroCaption}</p>
      <p className="mt-5 max-w-[52ch] text-lg leading-snug text-ink-muted">
        <MadLibsCopy copy={slide.copy} />
      </p>
    </article>
  );
}

function StatTile({ slide }: { slide: StorySlideContent }) {
  return (
    <article style={auraStyle(slide.aura)} className={TILE_CLASS}>
      <h3 className="font-mono text-[11px] tracking-[0.14em] text-ink-muted uppercase">{slide.title}</h3>
      <p key={slide.heroStat} className="value-swap mt-3 text-4xl leading-none font-semibold tracking-tighter text-accent tabular-nums">
        {slide.heroStat}
      </p>
      <p className="mt-2 text-sm text-ink-muted">{slide.heroCaption}</p>
    </article>
  );
}

function ComparisonContext({ meta }: { meta: ComparisonResult["meta"] }) {
  const parent = meta.givenParentBirthYear === undefined ? `born ${meta.parentBirthYear}, assumed` : `born ${meta.parentBirthYear}`;
  return (
    <p className="text-sm text-ink-muted">
      You in <span className="text-ink">{meta.currentYear}</span>, against your parent in{" "}
      <span className="text-ink">{meta.benchmarkYear}</span> at {meta.benchmarkAge} ({parent}).
      {meta.clampedYear !== null && ` ${meta.requestedBenchmarkYear} is outside our data, so ${meta.clampedYear} is shown.`}
    </p>
  );
}

interface SandboxResultsProps {
  input: ComparatorInput;
  result: ComparisonResult;
  slides: StorySlideContent[];
}

export function SandboxResults({ input, result, slides }: SandboxResultsProps) {
  const summary = slides.at(-1)!;
  return (
    <section aria-label="Results" className="flex flex-col gap-4">
      <div aria-live="polite" className="flex flex-col gap-4">
        <ComparisonContext meta={result.meta} />
        <SummaryTile slide={summary} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {slides.slice(0, -1).map((slide) => (
          <StatTile key={slide.id} slide={slide} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href={buildSharePath(input)}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-base font-semibold whitespace-nowrap text-page transition hover:bg-[#ff4d7a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
        >
          Play your story
          <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
        </Link>
        <Link
          href="/industries"
          className="rounded-md text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand"
        >
          Compare industries instead
        </Link>
      </div>
    </section>
  );
}
