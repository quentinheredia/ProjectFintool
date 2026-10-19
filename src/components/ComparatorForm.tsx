"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { ComparisonMode } from "@/lib/comparator-engine";
import type { ComparatorField, FieldErrors } from "@/lib/query-params";

const MODE_OPTIONS: { value: ComparisonMode; label: string }[] = [
  { value: "parent_peer", label: "30 years ago" },
  { value: "age_25", label: "Parents at 25" },
  { value: "age_30", label: "Parents at 30" },
  { value: "custom", label: "Pick a year" },
];

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-ink-faint bg-ink/[0.06] px-4 text-lg text-ink placeholder:text-ink/45 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/40 aria-invalid:border-[#ff6b8a]";

const digitsOnly = (value: string) => value.replace(/\D/g, "");
const groupThousands = (digits: string) => (digits ? Number(digits).toLocaleString("en-US") : "");

function Field({
  label,
  htmlFor,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-sm text-[#ff6b8a]">
          {error}
        </p>
      )}
    </div>
  );
}

interface ComparatorFormProps {
  fieldErrors?: FieldErrors;
  submitted?: Partial<Record<ComparatorField, string>>;
}

/** Plain GET form: the result URL is the share URL, and it works before JavaScript loads. */
export function ComparatorForm({ fieldErrors = {}, submitted = {} }: ComparatorFormProps) {
  const id = useId();
  const [incomeDigits, setIncomeDigits] = useState(digitsOnly(submitted.income ?? ""));
  const [mode, setMode] = useState<ComparisonMode>(
    MODE_OPTIONS.some((option) => option.value === submitted.comparisonMode)
      ? (submitted.comparisonMode as ComparisonMode)
      : "parent_peer",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>("[aria-invalid=true]")?.focus();
  }, []);
  const errorId = (field: ComparatorField) => `${id}-${field}-error`;
  const describedBy = (field: ComparatorField) => (fieldErrors[field] ? errorId(field) : undefined);

  return (
    <form ref={formRef} method="get" action="/" onSubmit={() => setIsSubmitting(true)} className="mt-8 flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Birth year" htmlFor={`${id}-by`} error={fieldErrors.birthYear} errorId={errorId("birthYear")}>
          <input
            id={`${id}-by`}
            name="by"
            inputMode="numeric"
            autoComplete="bday-year"
            maxLength={4}
            placeholder="1996"
            defaultValue={submitted.birthYear}
            required
            aria-invalid={Boolean(fieldErrors.birthYear)}
            aria-describedby={describedBy("birthYear")}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Annual income" htmlFor={`${id}-income`} error={fieldErrors.income} errorId={errorId("income")}>
          <div className="relative">
            <span aria-hidden className="absolute top-1/2 left-4 -translate-y-1/2 text-lg text-ink-muted">
              $
            </span>
            <input
              id={`${id}-income`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="68,000"
              value={groupThousands(incomeDigits)}
              onChange={(event) => setIncomeDigits(digitsOnly(event.target.value).slice(0, 8))}
              required
              aria-invalid={Boolean(fieldErrors.income)}
              aria-describedby={describedBy("income")}
              className={`${INPUT_CLASS} pl-8`}
            />
            <input type="hidden" name="inc" value={incomeDigits} />
          </div>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink">Compare against</legend>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-full border border-ink-faint px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink has-checked:border-brand has-checked:bg-brand has-checked:text-page has-focus-visible:outline-2 has-focus-visible:outline-brand/50"
            >
              <input
                type="radio"
                name="mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {mode === "custom" && (
        <div className="max-w-48">
          <Field
            label="Year to compare"
            htmlFor={`${id}-year`}
            error={fieldErrors.customBenchmarkYear}
            errorId={errorId("customBenchmarkYear")}
          >
            <input
              id={`${id}-year`}
              name="year"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="1985"
              defaultValue={submitted.customBenchmarkYear}
              required
              aria-invalid={Boolean(fieldErrors.customBenchmarkYear)}
              aria-describedby={describedBy("customBenchmarkYear")}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 items-center justify-center gap-2 self-stretch rounded-full bg-brand px-7 text-base font-semibold whitespace-nowrap text-page transition hover:bg-[#ff4d7a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98] disabled:opacity-70 sm:self-start"
      >
        {isSubmitting ? "Building your story…" : "Compare"}
        <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
      </button>
    </form>
  );
}
