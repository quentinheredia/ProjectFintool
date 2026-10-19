"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { FIRST_DATA_YEAR } from "@/data/yearly-metrics";
import {
  COMPARISON_MODES,
  CURRENT_YEAR,
  EMPLOYMENT_STATUSES,
  resolveBenchmark,
  type ComparisonMode,
  type EmploymentStatus,
} from "@/lib/comparator-engine";
import { COMPARISON_MODE_LABELS } from "@/lib/comparison-modes";
import { formatUsd, formatUsdCompact } from "@/lib/format";
import { BIRTH_YEAR_RANGE, INCOME_RANGE, WORK_START_YEAR_RANGE, yearsBetween } from "@/lib/input-limits";
import {
  groupThousands,
  inputFromDraft,
  isIncomeInRange,
  parentBirthYearOptions,
  withBirthYear,
  withIncomeText,
  type SandboxDraft,
} from "@/lib/sandbox-draft";
import type { WagePreset } from "@/lib/wage-presets";
import { INPUT_CLASS, PILL_CLASS, RADIO_PILL_CLASS } from "../form-styles";

const EMPLOYMENT_LABELS: Record<EmploymentStatus, string> = {
  working: "Working",
  student: "Student",
  not_working: "Not working",
};

const BIRTH_YEARS = yearsBetween(BIRTH_YEAR_RANGE);
const WORK_START_YEARS = yearsBetween(WORK_START_YEAR_RANGE);
const BENCHMARK_YEARS = yearsBetween({ min: FIRST_DATA_YEAR, max: CURRENT_YEAR - 1 });

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${INPUT_CLASS} appearance-none pr-10 [&_option]:bg-page`}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-muted"
        />
      </div>
    </div>
  );
}

function IncomeField({
  draft,
  wagePresets,
  onChange,
}: {
  draft: SandboxDraft;
  wagePresets: WagePreset[];
  onChange: (draft: SandboxDraft) => void;
}) {
  const id = useId();
  const typed = Number(draft.incomeText);
  const isOutOfRange = !draft.incomeText || !isIncomeInRange(typed);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {draft.employment === "student" ? "Expected annual income" : "Annual income"}
      </label>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Income presets">
        {wagePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={draft.income === preset.annualIncome && !isOutOfRange}
            onClick={() => onChange(withIncomeText(draft, String(preset.annualIncome)))}
            className={`${PILL_CLASS} py-1.5 aria-pressed:border-brand aria-pressed:text-ink active:scale-[0.98]`}
          >
            {preset.label} <span className="text-ink-muted">{formatUsdCompact(preset.annualIncome)}</span>
          </button>
        ))}
      </div>
      <div className="relative">
        <span aria-hidden className="absolute top-1/2 left-4 -translate-y-1/2 text-lg text-ink-muted">
          $
        </span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={groupThousands(draft.incomeText)}
          onChange={(event) => onChange(withIncomeText(draft, event.target.value))}
          aria-invalid={isOutOfRange}
          aria-describedby={isOutOfRange ? `${id}-range` : undefined}
          className={`${INPUT_CLASS} pl-8 tabular-nums`}
        />
      </div>
      {isOutOfRange && (
        <p id={`${id}-range`} className="text-sm text-[#ff6b8a]">
          Enter {formatUsd(INCOME_RANGE.min)} to {formatUsd(INCOME_RANGE.max)}. Showing {formatUsd(draft.income)} until then.
        </p>
      )}
    </div>
  );
}

interface SandboxControlsProps {
  draft: SandboxDraft;
  onChange: (draft: SandboxDraft) => void;
  wagePresets: WagePreset[];
  notWorkingIncome: number;
}

export function SandboxControls({ draft, onChange, wagePresets, notWorkingIncome }: SandboxControlsProps) {
  const update = (changes: Partial<SandboxDraft>) => onChange({ ...draft, ...changes });
  const benchmarkYearFor = (comparisonMode: ComparisonMode) =>
    resolveBenchmark({ ...inputFromDraft(draft), comparisonMode }).benchmarkYear;

  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()} aria-label="Comparison inputs">
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Your birth year" value={draft.birthYear} onChange={(value) => onChange(withBirthYear(draft, Number(value)))}>
          {BIRTH_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Parent's birth year"
          value={draft.parentBirthYear ?? ""}
          onChange={(value) => update({ parentBirthYear: value ? Number(value) : null })}
        >
          <option value="">Not sure</option>
          {parentBirthYearOptions(draft.birthYear).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectField>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink">Right now you are</legend>
        <div className="flex flex-wrap gap-2">
          {EMPLOYMENT_STATUSES.map((status) => (
            <label key={status} className={RADIO_PILL_CLASS}>
              <input
                type="radio"
                name="employment"
                value={status}
                checked={draft.employment === status}
                onChange={() => update({ employment: status })}
                className="sr-only"
              />
              {EMPLOYMENT_LABELS[status]}
            </label>
          ))}
        </div>
      </fieldset>

      {draft.employment === "not_working" ? (
        <p className="text-sm leading-relaxed text-ink-muted">
          Counted at full-time federal minimum wage, {formatUsd(notWorkingIncome)} a year.
        </p>
      ) : (
        <IncomeField draft={draft} wagePresets={wagePresets} onChange={onChange} />
      )}

      {draft.employment === "student" && (
        <SelectField
          label="Start working in"
          value={draft.workStartYear}
          onChange={(value) => update({ workStartYear: Number(value) })}
        >
          {WORK_START_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectField>
      )}

      <div className={`grid gap-4 ${draft.comparisonMode === "custom" ? "grid-cols-[1fr_7.5rem]" : ""}`}>
        <SelectField
          label="Compare against"
          value={draft.comparisonMode}
          onChange={(value) => update({ comparisonMode: value as ComparisonMode })}
        >
          {COMPARISON_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode === "custom" ? COMPARISON_MODE_LABELS.custom : `${COMPARISON_MODE_LABELS[mode]} (${benchmarkYearFor(mode)})`}
            </option>
          ))}
        </SelectField>
        {draft.comparisonMode === "custom" && (
          <SelectField
            label="Year"
            value={draft.customBenchmarkYear}
            onChange={(value) => update({ customBenchmarkYear: Number(value) })}
          >
            {BENCHMARK_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </SelectField>
        )}
      </div>
    </form>
  );
}
