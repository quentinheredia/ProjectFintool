"use client";

import { useEffect, useMemo, useState } from "react";
import { toMetricsTable, type YearlyMetrics } from "@/data/yearly-metrics";
import { buildSandboxPath, compareGenerations, type ComparatorInput } from "@/lib/comparator-engine";
import { draftFromInput, inputFromDraft } from "@/lib/sandbox-draft";
import { buildStorySlides } from "@/lib/story-content";
import type { WagePreset } from "@/lib/wage-presets";
import { SandboxControls } from "./SandboxControls";
import { SandboxResults } from "./SandboxResults";

interface SandboxProps {
  initialInput: ComparatorInput;
  /** Every year of metrics, so the comparison runs in the browser on each change. */
  metricsRows: YearlyMetrics[];
  wagePresets: WagePreset[];
  notWorkingIncome: number;
  /** The income the field starts with when the initial input has none (not working). */
  fallbackIncome: number;
}

export function Sandbox({ initialInput, metricsRows, wagePresets, notWorkingIncome, fallbackIncome }: SandboxProps) {
  const table = useMemo(() => toMetricsTable(metricsRows), [metricsRows]);
  const [draft, setDraft] = useState(() => draftFromInput(initialInput, fallbackIncome));
  const input = inputFromDraft(draft);
  const result = compareGenerations(input, table);
  const sandboxPath = buildSandboxPath(input);

  // The address bar always holds the current comparison, so a refresh or a copied link keeps it.
  useEffect(() => {
    window.history.replaceState(null, "", sandboxPath);
  }, [sandboxPath]);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[22rem_1fr]">
      <div className="lg:sticky lg:top-6">
        <SandboxControls draft={draft} onChange={setDraft} wagePresets={wagePresets} notWorkingIncome={notWorkingIncome} />
      </div>
      <SandboxResults input={input} result={result} slides={buildStorySlides(result)} />
    </div>
  );
}
