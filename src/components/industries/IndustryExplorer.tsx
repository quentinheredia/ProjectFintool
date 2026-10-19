"use client";

import { useEffect, useRef, useState } from "react";
import type { OccupationComparison, OccupationMeasure } from "@/lib/industry/occupation-comparison";
import { INDUSTRY_THEN_YEAR_RANGE } from "@/lib/industry/then-years";
import type { OccupationSummary } from "@/lib/industry/types";
import {
  formatMinutes,
  formatOneDecimal,
  formatPercent,
  formatSignedPercent,
  formatUsd,
  formatWholeNumber,
} from "@/lib/format";
import { RADIO_PILL_CLASS } from "../form-styles";
import { auraStyle } from "../story/CardShell";

const DECADE_STEP = 10;
const MID_DECADE_OFFSET = 5;

/** One mid-decade year per decade the data covers, e.g. 1985 for "1980s". */
const DECADES = Array.from(
  { length: Math.floor((INDUSTRY_THEN_YEAR_RANGE.max - INDUSTRY_THEN_YEAR_RANGE.min) / DECADE_STEP) + 1 },
  (_, index) => {
    const year = INDUSTRY_THEN_YEAR_RANGE.min + index * DECADE_STEP;
    return { year, label: `${year - MID_DECADE_OFFSET}s` };
  },
);

const formatMeasure = ({ unit }: OccupationMeasure, value: number) => {
  if (unit === "minutes") return `${formatMinutes(value)} min`;
  if (unit === "years") return `${formatOneDecimal(value)} yrs`;
  return `${formatWholeNumber(value)} hrs`;
};

type LoadState = "idle" | "loading" | "error";

function MeasureRow({ measure, thenYear, nowYear }: { measure: OccupationMeasure; thenYear: number; nowYear: number }) {
  const longest = Math.max(measure.then, measure.now);
  const rows = [
    { year: thenYear, value: measure.then, fill: "bg-ink/70" },
    { year: nowYear, value: measure.now, fill: "bg-accent" },
  ];
  return (
    <div>
      <h3 className="text-sm font-medium text-ink">{measure.label}</h3>
      <dl className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.year} className="grid grid-cols-[3rem_1fr_5.5rem] items-center gap-3 font-mono text-xs">
            <dt className="text-ink-muted">{row.year}</dt>
            <dd className="h-2">
              <span
                className={`block h-full origin-left rounded-full ${row.fill} transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
                style={{ transform: `scaleX(${row.value / longest})` }}
              />
            </dd>
            <dd className="text-right text-ink tabular-nums">{formatMeasure(measure, row.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ComparisonPanel({ comparison }: { comparison: OccupationComparison }) {
  const { occupation, thenYear, nowYear } = comparison;
  const isPlaceholder = occupation.status === "placeholder";
  return (
    <article style={auraStyle(comparison.verdict.aura)} className="rounded-3xl bg-aura p-6 ring-1 ring-ink-faint transition-colors duration-700 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] tracking-[0.14em] text-ink-muted uppercase">
          {occupation.label} • {thenYear} vs {nowYear}
        </h2>
        {isPlaceholder && (
          <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-medium text-ink">Sample data</span>
        )}
      </div>
      <p key={comparison.buyingPowerDeltaPct} className="value-swap mt-5 text-6xl leading-none font-semibold tracking-tighter text-accent tabular-nums md:text-7xl">
        {formatSignedPercent(comparison.buyingPowerDeltaPct)}
      </p>
      <p className="mt-2 text-base text-ink-muted">buying power vs the same job in {thenYear}</p>
      <p className="mt-5 max-w-[52ch] text-lg leading-snug text-ink-muted">
        The job paid <span className="font-semibold text-ink">{formatUsd(comparison.annualWageThen)}</span> in {thenYear} and{" "}
        <span className="font-semibold text-ink">{formatUsd(comparison.annualWageNow)}</span> now. Prices rose{" "}
        {formatPercent(comparison.priceGrowthPct)}, so the wage moved{" "}
        <span className="font-semibold text-ink">{formatSignedPercent(comparison.realWageChangePct)}</span> after inflation.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {comparison.measures.map((measure) => (
          <MeasureRow key={measure.id} measure={measure} thenYear={thenYear} nowYear={nowYear} />
        ))}
      </div>
      <p className="mt-8 font-mono text-[10px] tracking-[0.12em] text-ink-muted uppercase">Source: {comparison.source}</p>
    </article>
  );
}

interface IndustryExplorerProps {
  occupations: OccupationSummary[];
  initialComparison: OccupationComparison;
}

/** Picks a job and a decade, and asks `/api/industries/compare` for the comparison. */
export function IndustryExplorer({ occupations, initialComparison }: IndustryExplorerProps) {
  const [occupationId, setOccupationId] = useState(initialComparison.occupation.id);
  const [thenYear, setThenYear] = useState(initialComparison.thenYear);
  const [comparison, setComparison] = useState(initialComparison);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const isInitialRequest = useRef(true);

  useEffect(() => {
    if (isInitialRequest.current) {
      isInitialRequest.current = false;
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ occupation: occupationId, then: String(thenYear) });
    window.history.replaceState(null, "", `/industries?${params}`);
    setLoadState("loading");
    fetch(`/api/industries/compare?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Comparison request failed: ${response.status}`);
        return response.json() as Promise<OccupationComparison>;
      })
      .then((next) => {
        setComparison(next);
        setLoadState("idle");
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn(error);
          setLoadState("error");
        }
      });
    return () => controller.abort();
  }, [occupationId, thenYear]);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[22rem_1fr]">
      <form className="flex flex-col gap-8 lg:sticky lg:top-6" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-ink">Job</legend>
          <div className="flex flex-col gap-2">
            {occupations.map((occupation) => (
              <label
                key={occupation.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink-faint px-4 py-3 transition-colors hover:border-ink/30 has-checked:border-brand has-checked:bg-brand/10 has-focus-visible:outline-2 has-focus-visible:outline-brand/50"
              >
                <input
                  type="radio"
                  name="occupation"
                  value={occupation.id}
                  checked={occupationId === occupation.id}
                  onChange={() => setOccupationId(occupation.id)}
                  className="sr-only"
                />
                <span className="text-sm text-ink">{occupation.label}</span>
                <span className="text-xs text-ink-muted">{occupation.sector}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-ink">Compared with</legend>
          <div className="flex flex-wrap gap-2">
            {DECADES.map((decade) => (
              <label key={decade.year} className={RADIO_PILL_CLASS}>
                <input
                  type="radio"
                  name="then"
                  value={decade.year}
                  checked={thenYear === decade.year}
                  onChange={() => setThenYear(decade.year)}
                  className="sr-only"
                />
                {decade.label}
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-muted">Each decade is measured at its middle year.</p>
        </fieldset>
      </form>

      <div aria-live="polite" aria-busy={loadState === "loading"} className="transition-opacity aria-busy:opacity-60">
        {loadState === "error" && (
          <p role="alert" className="mb-4 rounded-xl border border-[#ff6b8a]/40 px-4 py-3 text-sm text-[#ff6b8a]">
            That comparison did not load. Pick it again to retry.
          </p>
        )}
        <ComparisonPanel comparison={comparison} />
      </div>
    </div>
  );
}
