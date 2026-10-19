import { formatOneDecimal } from "@/lib/format";
import { RETIREMENT_SPAN, careerSharePct } from "@/lib/visual-geometry";

interface RetirementBarProps {
  thenYear: number;
  retirementAgeThen: number;
  retirementAgeNow: number;
}

/** Ages 20 to 80: the career block pushing into the retirement block. */
export function RetirementBar({ thenYear, retirementAgeThen, retirementAgeNow }: RetirementBarProps) {
  const rows = [
    { label: String(thenYear), age: retirementAgeThen, careerClassName: "bg-ink/55" },
    { label: "Today", age: retirementAgeNow, careerClassName: "bg-accent" },
  ];
  return (
    <figure className="space-y-3">
      {rows.map((row) => {
        const careerShare = careerSharePct(row.age);
        return (
          <div key={row.label}>
            <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs text-ink-muted">
              <span>{row.label}</span>
              <span className="text-ink">retire at {formatOneDecimal(row.age)}</span>
            </div>
            <div className="flex h-9 gap-[2px]" aria-hidden>
              <div className={`rounded-l-md ${row.careerClassName}`} style={{ width: `${careerShare}%` }} />
              <div className="flex-1 rounded-r-md border border-dashed border-ink/40" />
            </div>
          </div>
        );
      })}
      <figcaption className="flex justify-between font-mono text-[10px] text-ink-muted">
        <span>Age {RETIREMENT_SPAN.startAge}</span>
        <span>Working years, then retirement</span>
        <span>{RETIREMENT_SPAN.endAge}</span>
      </figcaption>
    </figure>
  );
}
