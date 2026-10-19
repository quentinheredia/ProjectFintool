import type { SummaryCard } from "@/lib/comparator-engine";
import { formatMultiplier, formatSignedYears, formatUsdCompact, formatWholeNumber } from "@/lib/format";

interface SummaryBentoProps {
  summary: SummaryCard;
  thenYear: number;
}

/** 2x2 bento of the four headline metrics. */
export function SummaryBento({ summary, thenYear }: SummaryBentoProps) {
  const tiles = [
    {
      label: "Home price to income",
      value: `${formatMultiplier(summary.priceToIncome.then)} → ${formatMultiplier(summary.priceToIncome.now)}`,
      className: "bg-accent text-on-accent",
      labelClassName: "text-on-accent/75",
    },
    {
      label: `Salary to match ${thenYear} housing`,
      value: formatUsdCompact(summary.housingParitySalary),
      className:
        "bg-ink/[0.07] bg-[repeating-linear-gradient(135deg,transparent_0_7px,rgba(245,245,242,0.05)_7px_8px)]",
      labelClassName: "text-ink-muted",
    },
    {
      label: "Min-wage hours for a used car",
      value: `${formatWholeNumber(summary.minWageHoursForUsedCar.then)} → ${formatWholeNumber(summary.minWageHoursForUsedCar.now)}`,
      className: "bg-ink/[0.07]",
      labelClassName: "text-ink-muted",
    },
    {
      label: "Groceries, retirement",
      value: `${formatMultiplier(summary.groceryMultiplier)} / ${formatSignedYears(summary.retirementYearsLost)} yrs`,
      className: "border border-accent/50",
      labelClassName: "text-ink-muted",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 tabular-nums">
      {tiles.map((tile) => (
        <div key={tile.label} className={`flex min-h-24 flex-col justify-between rounded-xl p-3 ${tile.className}`}>
          <p className={`text-[11px] leading-tight ${tile.labelClassName}`}>{tile.label}</p>
          <p className="mt-2 text-xl leading-none font-semibold tracking-tight">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}
