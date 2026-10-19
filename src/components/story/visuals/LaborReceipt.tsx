"use client";

import { useState } from "react";
import { WAGE_BASES, type LaborReceipt as LaborReceiptData, type WageBasis } from "@/lib/comparator-engine";
import { formatMinutes, formatUsdCents } from "@/lib/format";

const WAGE_BASIS_LABELS: Record<WageBasis, string> = {
  user: "My wage",
  median: "Median wage",
  minimum: "Minimum wage",
};

interface LaborReceiptProps {
  receipt: LaborReceiptData;
  thenYear: number;
  nowYear: number;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function ReceiptCell({ minutes, price }: { minutes: number; price: number }) {
  return (
    <td className="py-1 text-right align-top">
      <span className="block text-[13px] font-semibold">{formatMinutes(minutes)} min</span>
      <span className="block text-[10px] text-paper-ink/60">{formatUsdCents(price)}</span>
    </td>
  );
}

/** A thermal grocery receipt priced in minutes of labor, switchable between wage bases. */
export function LaborReceipt({ receipt, thenYear, nowYear }: LaborReceiptProps) {
  const [basis, setBasis] = useState<WageBasis>("user");
  const totalMinutesThen = sum(receipt.lines.map((line) => line.minutesThen[basis]));
  const totalMinutesNow = sum(receipt.lines.map((line) => line.minutesNow[basis]));

  return (
    <div data-interactive>
      <div role="group" aria-label="Price the receipt in" className="mb-2.5 flex gap-1 rounded-full bg-ink/10 p-1">
        {WAGE_BASES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={basis === option}
            onClick={() => setBasis(option)}
            className="flex-1 rounded-full px-2 py-1.5 text-xs font-medium whitespace-nowrap text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-accent aria-pressed:text-on-accent"
          >
            {WAGE_BASIS_LABELS[option]}
          </button>
        ))}
      </div>

      <div className="rounded-md bg-paper px-3.5 py-3 font-mono text-paper-ink shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]">
        <table className="w-full border-collapse text-[11px] tabular-nums">
          <caption className="pb-2 text-left text-[10px] tracking-[0.14em] uppercase">
            Labor-hour receipt
          </caption>
          <thead>
            <tr className="border-b border-dashed border-paper-ink/40 text-[10px] tracking-wider uppercase">
              <th scope="col" className="pb-1 text-left font-normal">Item</th>
              <th scope="col" className="pb-1 text-right font-normal">{thenYear}</th>
              <th scope="col" className="pb-1 text-right font-normal">{nowYear}</th>
            </tr>
          </thead>
          <tbody>
            {receipt.lines.map((line) => (
              <tr key={line.item}>
                <th scope="row" className="py-1 pr-2 text-left align-top font-normal">{line.label}</th>
                <ReceiptCell minutes={line.minutesThen[basis]} price={line.priceThen} />
                <ReceiptCell minutes={line.minutesNow[basis]} price={line.priceNow} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-dashed border-paper-ink/40 text-[13px] font-semibold">
              <th scope="row" className="pt-1.5 text-left">Total</th>
              <td className="pt-1.5 text-right">{formatMinutes(totalMinutesThen)} min</td>
              <td className="pt-1.5 text-right">{formatMinutes(totalMinutesNow)} min</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-2 text-[10px] text-paper-ink/60">
          At {formatUsdCents(receipt.wagesThen[basis])}/hr in {thenYear} vs {formatUsdCents(receipt.wagesNow[basis])}/hr
          today
        </p>
      </div>
    </div>
  );
}
