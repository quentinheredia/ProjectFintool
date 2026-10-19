import { formatUsdCents } from "@/lib/format";
import { DOLLAR_NOTE_MAX_WIDTH_PCT } from "@/lib/visual-geometry";

interface DollarErosionProps {
  thenYear: number;
  dollarValueLossPct: number;
}

export function DollarErosion({ thenYear, dollarValueLossPct }: DollarErosionProps) {
  const remainingValue = 1 - dollarValueLossPct / 100;
  const notes = [
    { label: `$1.00 in ${thenYear}`, fraction: 1, className: "border-ink-faint bg-ink/10" },
    { label: `${formatUsdCents(remainingValue)} today`, fraction: remainingValue, className: "border-accent bg-accent/20" },
  ];
  return (
    <figure aria-label={`A ${thenYear} dollar is worth ${formatUsdCents(remainingValue)} today`} className="space-y-2.5">
      {notes.map((note) => (
        <div key={note.label} className="flex items-center gap-3">
          <div
            className={`h-12 shrink-0 rounded-lg border ${note.className}`}
            style={{ width: `${Math.max(note.fraction * DOLLAR_NOTE_MAX_WIDTH_PCT, 4)}%` }}
          />
          <span className="font-mono text-sm whitespace-nowrap text-ink">{note.label}</span>
        </div>
      ))}
    </figure>
  );
}
