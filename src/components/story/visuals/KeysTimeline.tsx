import { formatOneDecimal } from "@/lib/format";
import { MAX_YEAR_BLOCKS } from "@/lib/visual-geometry";

interface KeysTimelineProps {
  thenYear: number;
  yearsToSaveThen: number;
  yearsToSaveNow: number;
}

function YearBlocks({ years, filledClassName }: { years: number; filledClassName: string }) {
  const shownYears = Math.min(years, MAX_YEAR_BLOCKS);
  const blockCount = Math.max(Math.ceil(shownYears), 1);
  return (
    <div className="flex flex-wrap gap-1" aria-hidden>
      {Array.from({ length: blockCount }, (_, index) => {
        const fill = Math.min(Math.max(shownYears - index, 0), 1);
        return (
          <span key={index} className="relative h-6 w-2.5 overflow-hidden rounded-[3px] bg-ink-faint">
            <span className={`absolute inset-y-0 left-0 ${filledClassName}`} style={{ width: `${fill * 100}%` }} />
          </span>
        );
      })}
      {years > MAX_YEAR_BLOCKS && <span className="self-center font-mono text-xs text-ink-muted">+</span>}
    </div>
  );
}

/** One block per year of saving before getting the keys. */
export function KeysTimeline({ thenYear, yearsToSaveThen, yearsToSaveNow }: KeysTimelineProps) {
  const rows = [
    { label: `${thenYear} peer`, years: yearsToSaveThen, filledClassName: "bg-ink/70" },
    { label: "You, today", years: yearsToSaveNow, filledClassName: "bg-accent" },
  ];
  return (
    <figure className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs text-ink-muted">
            <span>{row.label}</span>
            <span className="text-ink">{formatOneDecimal(row.years)} yrs to keys</span>
          </div>
          <YearBlocks years={row.years} filledClassName={row.filledClassName} />
        </div>
      ))}
    </figure>
  );
}
