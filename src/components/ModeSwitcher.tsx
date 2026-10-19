"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ChangeEvent } from "react";
import { ChevronDown } from "lucide-react";
import { FIRST_DATA_YEAR } from "@/data/yearly-metrics";
import {
  CURRENT_YEAR,
  buildSharePath,
  inputFromMeta,
  resolveBenchmark,
  type ComparatorInput,
  type ComparisonMode,
  type ComparisonResult,
} from "@/lib/comparator-engine";
import { COMPARISON_MODE_LABELS } from "@/lib/comparison-modes";

const CUSTOM_YEAR_STEP = 5;
const CUSTOM_PREFIX = "custom:";
const PRESET_MODES = ["parent_peer", "age_25", "age_30"] as const satisfies readonly ComparisonMode[];


const customYears = Array.from(
  { length: Math.floor((CURRENT_YEAR - 1 - FIRST_DATA_YEAR) / CUSTOM_YEAR_STEP) + 1 },
  (_, index) => FIRST_DATA_YEAR + index * CUSTOM_YEAR_STEP,
);

function toInput(meta: ComparisonResult["meta"], value: string): ComparatorInput {
  const base = inputFromMeta(meta);
  if (value.startsWith(CUSTOM_PREFIX)) {
    return { ...base, comparisonMode: "custom", customBenchmarkYear: Number(value.slice(CUSTOM_PREFIX.length)) };
  }
  return { ...base, comparisonMode: value as ComparisonMode, customBenchmarkYear: undefined };
}

export function ModeSwitcher({ meta }: { meta: ComparisonResult["meta"] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selectedValue =
    meta.comparisonMode === "custom" ? `${CUSTOM_PREFIX}${meta.requestedBenchmarkYear}` : meta.comparisonMode;
  const yearOptions = customYears.includes(meta.requestedBenchmarkYear) || meta.comparisonMode !== "custom"
    ? customYears
    : [...customYears, meta.requestedBenchmarkYear].sort((a, b) => a - b);

  function navigate(event: ChangeEvent<HTMLSelectElement>) {
    const path = buildSharePath(toInput(meta, event.target.value));
    startTransition(() => router.push(path, { scroll: false }));
  }

  return (
    <label className="relative inline-flex items-center" aria-busy={isPending}>
      <span className="sr-only">Compare against</span>
      <select
        value={selectedValue}
        onChange={navigate}
        disabled={isPending}
        className="appearance-none rounded-full bg-ink/12 py-1.5 pr-8 pl-3 text-xs font-medium text-ink backdrop-blur-md transition hover:bg-ink/20 [&_optgroup]:bg-page [&_option]:bg-page [&_option]:text-ink focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
      >
        {PRESET_MODES.map((mode) => {
          const year = resolveBenchmark({ ...inputFromMeta(meta), comparisonMode: mode }).benchmarkYear;
          return (
            <option key={mode} value={mode}>
              {COMPARISON_MODE_LABELS[mode]} ({year})
            </option>
          );
        })}
        <optgroup label={COMPARISON_MODE_LABELS.custom}>
          {yearOptions.map((year) => (
            <option key={year} value={`${CUSTOM_PREFIX}${year}`}>
              Year {year}
            </option>
          ))}
        </optgroup>
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 size-3.5 text-ink-muted" strokeWidth={2} />
    </label>
  );
}
