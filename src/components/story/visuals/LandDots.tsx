import { formatWholeNumber } from "@/lib/format";
import { MAX_LAND_DOTS, landHoursPerDot } from "@/lib/visual-geometry";

interface LandDotsProps {
  thenYear: number;
  hoursThen: number;
  hoursNow: number;
}

function DotRow({ count, className }: { count: number; className: string }) {
  const shown = Math.min(count, MAX_LAND_DOTS);
  return (
    <div className="flex flex-wrap gap-[3px]" aria-hidden>
      {Array.from({ length: Math.max(shown, 1) }, (_, index) => (
        <span key={index} className={`size-1.5 rounded-full ${className}`} />
      ))}
      {count > MAX_LAND_DOTS && (
        <span className="ml-1 font-mono text-[10px] leading-none text-ink-muted">+{formatWholeNumber(count - MAX_LAND_DOTS)}</span>
      )}
    </div>
  );
}

/** Dot matrix of work hours traded for a quarter-acre lot. */
export function LandDots({ thenYear, hoursThen, hoursNow }: LandDotsProps) {
  const hoursPerDot = landHoursPerDot(Math.max(hoursThen, hoursNow));
  const rows = [
    { label: `Median worker, ${thenYear}`, hours: hoursThen, className: "bg-ink/70" },
    { label: "You, today", hours: hoursNow, className: "bg-accent" },
  ];
  return (
    <figure className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs text-ink-muted">
            <span>{row.label}</span>
            <span className="text-ink">{formatWholeNumber(row.hours)} hrs</span>
          </div>
          <DotRow count={Math.round(row.hours / hoursPerDot)} className={row.className} />
        </div>
      ))}
      <figcaption className="font-mono text-[10px] text-ink-muted">
        Each dot = {formatWholeNumber(hoursPerDot)} hours of work
      </figcaption>
    </figure>
  );
}
