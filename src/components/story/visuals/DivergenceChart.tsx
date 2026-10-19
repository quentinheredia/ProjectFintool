"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { DIVERGENCE_SERIES, type DivergencePoint, type DivergenceSeries } from "@/lib/comparator-engine";
import { formatSignedPercent } from "@/lib/format";
import { DIVERGENCE_SERIES_STYLE } from "@/lib/visual-geometry";


const WIDTH = 320;
const HEIGHT = 170;
const PLOT = { left: 30, right: 262, top: 10, bottom: 152 };
const MIN_LABEL_GAP = 11;
const INDEX_BASE = 100;

function niceTicks(min: number, max: number): number[] {
  const roughStep = (max - min) / 3;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= roughStep)!;
  const ticks: number[] = [];
  for (let tick = Math.ceil(min / step) * step; tick <= max; tick += step) ticks.push(tick);
  return ticks;
}

function spreadLabels(targets: { series: DivergenceSeries; y: number }[]) {
  const sorted = [...targets].sort((a, b) => a.y - b.y);
  sorted.forEach((label, index) => {
    if (index > 0) label.y = Math.max(label.y, sorted[index - 1].y + MIN_LABEL_GAP);
  });
  return sorted;
}

const growthFromBase = (indexValue: number) => formatSignedPercent(indexValue - INDEX_BASE);

interface DivergenceChartProps {
  points: DivergencePoint[];
  thenYear: number;
}

/** Base-100 indexed divergence chart with series toggles and a scrubbable crosshair. */
export function DivergenceChart({ points, thenYear }: DivergenceChartProps) {
  const [visible, setVisible] = useState<ReadonlySet<DivergenceSeries>>(() => new Set(DIVERGENCE_SERIES));
  const [activeIndex, setActiveIndex] = useState(points.length - 1);
  const shownSeries = DIVERGENCE_SERIES.filter((series) => visible.has(series));

  const values = points.flatMap((point) => shownSeries.map((series) => point[series]));
  const yMin = Math.min(INDEX_BASE, ...values);
  const yMax = Math.max(INDEX_BASE * 1.1, ...values);
  const x = (index: number) => PLOT.left + (index / Math.max(points.length - 1, 1)) * (PLOT.right - PLOT.left);
  const y = (value: number) => PLOT.bottom - ((value - yMin) / (yMax - yMin)) * (PLOT.bottom - PLOT.top);
  const lastIndex = points.length - 1;
  const active = points[activeIndex];
  const endLabels = spreadLabels(shownSeries.map((series) => ({ series, y: y(points[lastIndex][series]) })));

  function toggleSeries(series: DivergenceSeries) {
    setVisible((current) => {
      const next = new Set(current);
      if (next.has(series)) next.delete(series);
      else next.add(series);
      return next.size === 0 ? current : next;
    });
  }

  function scrubTo(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
    const ratio = (svgX - PLOT.left) / (PLOT.right - PLOT.left);
    const nextIndex = Math.round(Math.min(Math.max(ratio, 0), 1) * lastIndex);
    if (nextIndex !== activeIndex) setActiveIndex(nextIndex);
  }

  function stepWithKeys(event: KeyboardEvent<SVGSVGElement>) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((index) => Math.min(Math.max(index + step, 0), lastIndex));
  }

  return (
    <div data-interactive data-no-drag className="rounded-xl bg-chart-surface p-3">
      <div role="group" aria-label="Show series" className="mb-2 flex flex-wrap gap-1.5">
        {DIVERGENCE_SERIES.map((series) => (
          <button
            key={series}
            type="button"
            aria-pressed={visible.has(series)}
            onClick={() => toggleSeries(series)}
            className="flex items-center gap-1.5 rounded-full border border-ink-faint px-2.5 py-1 text-[11px] text-ink-muted transition-opacity focus-visible:outline-2 focus-visible:outline-accent aria-[pressed=false]:opacity-45 aria-pressed:text-ink"
          >
            <span className="h-0.5 w-3 rounded-full" style={{ background: DIVERGENCE_SERIES_STYLE[series].color }} />
            {DIVERGENCE_SERIES_STYLE[series].label}
          </button>
        ))}
      </div>

      <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 font-mono text-[11px] tabular-nums">
        <span className="text-ink-muted">{active.year}</span>
        {shownSeries.map((series) => (
          <span key={series} className="text-ink-muted">
            <strong className="font-semibold text-ink">{growthFromBase(active[series])}</strong>{" "}
            {DIVERGENCE_SERIES_STYLE[series].label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none overflow-visible select-none focus-visible:outline-2 focus-visible:outline-accent"
        role="img"
        aria-label={`Growth since ${thenYear}, indexed to 100. Use left and right arrow keys to move through years.`}
        tabIndex={0}
        onPointerMove={scrubTo}
        onPointerDown={scrubTo}
        onKeyDown={stepWithKeys}
      >
        {niceTicks(yMin, yMax).map((tick) => (
          <g key={tick}>
            <line x1={PLOT.left} x2={PLOT.right} y1={y(tick)} y2={y(tick)} stroke="var(--ink-faint)" strokeWidth={1} />
            <text x={PLOT.left - 6} y={y(tick) + 3} textAnchor="end" fontSize={9} fill="var(--ink-muted)">
              {tick}
            </text>
          </g>
        ))}
        <text x={PLOT.left} y={HEIGHT - 2} fontSize={9} fill="var(--ink-muted)">{points[0].year}</text>
        <text x={PLOT.right} y={HEIGHT - 2} fontSize={9} textAnchor="end" fill="var(--ink-muted)">
          {points[lastIndex].year}
        </text>

        <line
          x1={x(activeIndex)}
          x2={x(activeIndex)}
          y1={PLOT.top}
          y2={PLOT.bottom}
          stroke="var(--ink-muted)"
          strokeWidth={1}
        />

        {shownSeries.map((series) => (
          <polyline
            key={series}
            fill="none"
            stroke={DIVERGENCE_SERIES_STYLE[series].color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points.map((point, index) => `${x(index)},${y(point[series])}`).join(" ")}
          />
        ))}
        {shownSeries.map((series) => (
          <circle
            key={series}
            cx={x(activeIndex)}
            cy={y(active[series])}
            r={4}
            fill={DIVERGENCE_SERIES_STYLE[series].color}
            stroke="var(--chart-surface)"
            strokeWidth={2}
          />
        ))}
        {endLabels.map(({ series, y: labelY }) => (
          <text key={series} x={PLOT.right + 8} y={labelY + 3} fontSize={10} fill="var(--ink)">
            {DIVERGENCE_SERIES_STYLE[series].label}
          </text>
        ))}
      </svg>

      <table className="sr-only">
        <caption>Index of each series, {thenYear} = 100</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            {DIVERGENCE_SERIES.map((series) => (
              <th key={series} scope="col">{DIVERGENCE_SERIES_STYLE[series].label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.year}>
              <th scope="row">{point.year}</th>
              {DIVERGENCE_SERIES.map((series) => (
                <td key={series}>{Math.round(point[series])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
