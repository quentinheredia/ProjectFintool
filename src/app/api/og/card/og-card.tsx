/**
 * Satori markup for the shareable PNG cards. Satori rules: inline styles only, `display: "flex"` on every
 * element with more than one child, no CSS Grid, and each text node must be a single string.
 */
import type { CSSProperties, ReactNode } from "react";
import { AURA_THEMES, INK, INK_MUTED } from "@/lib/aura";
import {
  DIVERGENCE_SERIES,
  type ComparisonResult,
  type DivergencePoint,
  type LaborReceipt,
  type StoryCards,
} from "@/lib/comparator-engine";
import {
  formatMinutes,
  formatMultiplier,
  formatOneDecimal,
  formatSignedPercent,
  formatSignedYears,
  formatUsdCents,
  formatUsdCompact,
  formatWholeNumber,
} from "@/lib/format";
import type { OgFormat } from "@/lib/og-card-params";
import type { CopySegment, StorySlideContent } from "@/lib/story-content";
import {
  DIVERGENCE_SERIES_STYLE,
  DOLLAR_NOTE_MAX_WIDTH_PCT,
  MAX_LAND_DOTS,
  MAX_YEAR_BLOCKS,
  careerSharePct,
  landHoursPerDot,
} from "@/lib/visual-geometry";

const INK_FAINT = "rgba(245, 245, 242, 0.14)";
const PAPER = "#F2F1EC";
const PAPER_INK = "#151515";
const CHART_SURFACE = "#161616";
const MONO = "GeistMono";
/** Rough average advance width of Geist SemiBold glyphs, used to shrink long hero stats to fit. */
const HERO_GLYPH_WIDTH_EM = 0.58;
const WORD_SPACE_EM = 0.2;

interface FormatSpec {
  direction: "column" | "row";
  padding: number;
  eyebrowSize: number;
  heroMaxSize: number;
  textWidth: number;
  captionSize: number;
  copySize: number;
  footerSize: number;
  visualWidth: number;
  /** Multiplier from the 342px-wide mobile visuals to this format. */
  unit: number;
}

const FORMAT_SPECS: Record<OgFormat, FormatSpec> = {
  story: {
    direction: "column",
    padding: 96,
    eyebrowSize: 28,
    heroMaxSize: 230,
    textWidth: 888,
    captionSize: 42,
    copySize: 52,
    footerSize: 22,
    visualWidth: 888,
    unit: 2.6,
  },
  social: {
    direction: "row",
    padding: 56,
    eyebrowSize: 16,
    heroMaxSize: 116,
    textWidth: 560,
    captionSize: 23,
    copySize: 27,
    footerSize: 13,
    visualWidth: 480,
    unit: 1.4,
  },
};

interface VisualProps {
  result: ComparisonResult;
  accent: string;
  /** Scales a mobile-sized length (in px) to this format. */
  u: (px: number) => number;
  width: number;
}

const row = (style: CSSProperties = {}): CSSProperties => ({ display: "flex", flexDirection: "row", ...style });
const column = (style: CSSProperties = {}): CSSProperties => ({ display: "flex", flexDirection: "column", ...style });

function LabeledRow({ label, value, u }: { label: string; value: string; u: VisualProps["u"] }) {
  return (
    <div style={row({ justifyContent: "space-between", fontFamily: MONO, fontSize: u(12), marginBottom: u(6) })}>
      <span style={{ color: INK_MUTED }}>{label}</span>
      <span style={{ color: INK }}>{value}</span>
    </div>
  );
}

function DollarVisual({ result, accent, u }: VisualProps) {
  const [dollar] = result.cards;
  const remaining = 1 - dollar.dollarValueLossPct / 100;
  const notes = [
    { label: `$1.00 in ${result.meta.benchmarkYear}`, fraction: 1, border: INK_FAINT, fill: "rgba(245,245,242,0.10)" },
    { label: `${formatUsdCents(remaining)} today`, fraction: remaining, border: accent, fill: `${accent}33` },
  ];
  return (
    <div style={column({ gap: u(10) })}>
      {notes.map((note) => (
        <div key={note.label} style={row({ alignItems: "center", gap: u(12) })}>
          <div
            style={{
              width: `${Math.max(note.fraction * DOLLAR_NOTE_MAX_WIDTH_PCT, 4)}%`,
              height: u(48),
              borderRadius: u(8),
              border: `${u(1)}px solid ${note.border}`,
              backgroundColor: note.fill,
            }}
          />
          <span style={{ fontFamily: MONO, fontSize: u(14), color: INK }}>{note.label}</span>
        </div>
      ))}
    </div>
  );
}

function YearBlocks({ years, fill, u }: { years: number; fill: string; u: VisualProps["u"] }) {
  const shownYears = Math.min(years, MAX_YEAR_BLOCKS);
  const blockCount = Math.max(Math.ceil(shownYears), 1);
  return (
    <div style={row({ flexWrap: "wrap", gap: u(4) })}>
      {Array.from({ length: blockCount }, (_, index) => (
        <div
          key={index}
          style={row({ width: u(10), height: u(24), borderRadius: u(3), backgroundColor: INK_FAINT, overflow: "hidden" })}
        >
          <div style={{ width: `${Math.min(Math.max(shownYears - index, 0), 1) * 100}%`, backgroundColor: fill }} />
        </div>
      ))}
    </div>
  );
}

function HousingVisual({ result, accent, u }: VisualProps) {
  const housing = result.cards[1];
  const rows = [
    { label: `${result.meta.benchmarkYear} peer`, years: housing.yearsToSaveThen, fill: "rgba(245,245,242,0.7)" },
    { label: "You, today", years: housing.yearsToSaveNow, fill: accent },
  ];
  return (
    <div style={column({ gap: u(14) })}>
      {rows.map((entry) => (
        <div key={entry.label} style={column()}>
          <LabeledRow label={entry.label} value={`${formatOneDecimal(entry.years)} yrs to keys`} u={u} />
          <YearBlocks years={entry.years} fill={entry.fill} u={u} />
        </div>
      ))}
    </div>
  );
}

function ReceiptVisual({ result, u }: VisualProps) {
  const receipt: LaborReceipt = result.charts.laborReceipt;
  const { benchmarkYear, currentYear } = result.meta;
  const total = (pick: (line: LaborReceipt["lines"][number]) => number) =>
    receipt.lines.reduce((sum, line) => sum + pick(line), 0);
  const cell = (minutes: number, price: number) => (
    <div style={column({ alignItems: "flex-end", width: u(78) })}>
      <span style={{ fontSize: u(13), fontWeight: 600 }}>{`${formatMinutes(minutes)} min`}</span>
      <span style={{ fontSize: u(10), color: "rgba(21,21,21,0.6)" }}>{formatUsdCents(price)}</span>
    </div>
  );
  const divider = { borderTop: `${u(1)}px dashed rgba(21,21,21,0.4)` };
  const rightAligned = (text: string) => (
    <div style={row({ width: u(78), justifyContent: "flex-end" })}>
      <span>{text}</span>
    </div>
  );
  return (
    <div
      style={column({
        backgroundColor: PAPER,
        color: PAPER_INK,
        fontFamily: MONO,
        borderRadius: u(6),
        padding: `${u(12)}px ${u(14)}px`,
        fontSize: u(11),
      })}
    >
      <span style={{ fontSize: u(10), letterSpacing: u(1.4), marginBottom: u(8) }}>LABOR-HOUR RECEIPT, YOUR WAGE</span>
      <div style={row({ fontSize: u(10), paddingBottom: u(4) })}>
        <span style={{ flex: 1 }}>ITEM</span>
        {rightAligned(String(benchmarkYear))}
        {rightAligned(String(currentYear))}
      </div>
      <div style={column({ ...divider, paddingTop: u(4), gap: u(6) })}>
        {receipt.lines.map((line) => (
          <div key={line.item} style={row()}>
            <span style={{ flex: 1 }}>{line.label}</span>
            {cell(line.minutesThen.user, line.priceThen)}
            {cell(line.minutesNow.user, line.priceNow)}
          </div>
        ))}
      </div>
      <div style={row({ ...divider, marginTop: u(8), paddingTop: u(6), fontSize: u(13), fontWeight: 600 })}>
        <span style={{ flex: 1 }}>Total</span>
        {rightAligned(`${formatMinutes(total((line) => line.minutesThen.user))} min`)}
        {rightAligned(`${formatMinutes(total((line) => line.minutesNow.user))} min`)}
      </div>
    </div>
  );
}

function DotRow({ count, color, u }: { count: number; color: string; u: VisualProps["u"] }) {
  const shown = Math.max(Math.min(count, MAX_LAND_DOTS), 1);
  return (
    <div style={row({ flexWrap: "wrap", gap: u(3), alignItems: "center" })}>
      {Array.from({ length: shown }, (_, index) => (
        <div key={index} style={{ width: u(6), height: u(6), borderRadius: u(3), backgroundColor: color }} />
      ))}
      {count > MAX_LAND_DOTS && (
        <span style={{ fontFamily: MONO, fontSize: u(10), color: INK_MUTED, marginLeft: u(4) }}>
          {`+${formatWholeNumber(count - MAX_LAND_DOTS)}`}
        </span>
      )}
    </div>
  );
}

function LandVisual({ result, accent, u }: VisualProps) {
  const land = result.cards[3];
  const hoursPerDot = landHoursPerDot(Math.max(land.hoursThen, land.hoursNowUser));
  const rows = [
    { label: `Median worker, ${result.meta.benchmarkYear}`, hours: land.hoursThen, color: "rgba(245,245,242,0.7)" },
    { label: "You, today", hours: land.hoursNowUser, color: accent },
  ];
  return (
    <div style={column({ gap: u(14) })}>
      {rows.map((entry) => (
        <div key={entry.label} style={column()}>
          <LabeledRow label={entry.label} value={`${formatWholeNumber(entry.hours)} hrs`} u={u} />
          <DotRow count={Math.round(entry.hours / hoursPerDot)} color={entry.color} u={u} />
        </div>
      ))}
      <span style={{ fontFamily: MONO, fontSize: u(10), color: INK_MUTED }}>
        {`Each dot = ${formatWholeNumber(hoursPerDot)} hours of work`}
      </span>
    </div>
  );
}

function divergencePolyline(points: DivergencePoint[], series: (typeof DIVERGENCE_SERIES)[number], box: { width: number; height: number; min: number; max: number }) {
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * box.width;
      const y = box.height - ((point[series] - box.min) / (box.max - box.min)) * box.height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function DivergenceVisual({ result, u, width }: VisualProps) {
  const points = result.charts.divergence;
  const last = points[points.length - 1];
  const values = points.flatMap((point) => DIVERGENCE_SERIES.map((series) => point[series]));
  const innerWidth = width - u(24);
  const box = { width: innerWidth, height: u(150), min: Math.min(100, ...values), max: Math.max(110, ...values) };
  return (
    <div style={column({ backgroundColor: CHART_SURFACE, borderRadius: u(12), padding: u(12), gap: u(8) })}>
      <div style={row({ flexWrap: "wrap", gap: u(12) })}>
        {DIVERGENCE_SERIES.map((series) => (
          <div key={series} style={row({ alignItems: "center", gap: u(6), fontSize: u(11) })}>
            <div style={{ width: u(12), height: u(2), backgroundColor: DIVERGENCE_SERIES_STYLE[series].color }} />
            <span style={{ color: INK_MUTED }}>{DIVERGENCE_SERIES_STYLE[series].label}</span>
            <span style={{ color: INK, fontWeight: 600 }}>{formatSignedPercent(last[series] - 100)}</span>
          </div>
        ))}
      </div>
      <svg width={box.width} height={box.height} viewBox={`0 0 ${box.width} ${box.height}`}>
        <line x1={0} x2={box.width} y1={box.height} y2={box.height} stroke={INK_FAINT} strokeWidth={u(1)} />
        {DIVERGENCE_SERIES.map((series) => (
          <polyline
            key={series}
            points={divergencePolyline(points, series, box)}
            fill="none"
            stroke={DIVERGENCE_SERIES_STYLE[series].color}
            strokeWidth={u(2)}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div style={row({ justifyContent: "space-between", fontSize: u(10), color: INK_MUTED })}>
        <span>{`${points[0].year} = 100`}</span>
        <span>{String(last.year)}</span>
      </div>
    </div>
  );
}

function RetirementVisual({ result, accent, u }: VisualProps) {
  const retirement = result.cards[5];
  const rows = [
    { label: String(result.meta.benchmarkYear), age: retirement.retirementAgeThen, fill: "rgba(245,245,242,0.55)" },
    { label: "Today", age: retirement.retirementAgeNow, fill: accent },
  ];
  return (
    <div style={column({ gap: u(14) })}>
      {rows.map((entry) => (
        <div key={entry.label} style={column()}>
          <LabeledRow label={entry.label} value={`retire at ${formatOneDecimal(entry.age)}`} u={u} />
          <div style={row({ height: u(36), gap: u(2) })}>
            <div
              style={{
                width: `${careerSharePct(entry.age)}%`,
                backgroundColor: entry.fill,
                borderTopLeftRadius: u(6),
                borderBottomLeftRadius: u(6),
              }}
            />
            <div
              style={{
                flex: 1,
                border: `${u(1)}px dashed rgba(245,245,242,0.4)`,
                borderTopRightRadius: u(6),
                borderBottomRightRadius: u(6),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryVisual({ result, accent, u }: VisualProps) {
  const summary = result.cards[6];
  const onAccent = AURA_THEMES[summary.verdict.aura].onAccent;
  const tiles = [
    {
      label: "Home price to income",
      value: `${formatMultiplier(summary.priceToIncome.then)} → ${formatMultiplier(summary.priceToIncome.now)}`,
      style: { backgroundColor: accent, color: onAccent },
    },
    {
      label: `Salary to match ${result.meta.benchmarkYear} housing`,
      value: formatUsdCompact(summary.housingParitySalary),
      style: { backgroundColor: "rgba(245,245,242,0.07)" },
    },
    {
      label: "Min-wage hours for a used car",
      value: `${formatWholeNumber(summary.minWageHoursForUsedCar.then)} → ${formatWholeNumber(summary.minWageHoursForUsedCar.now)}`,
      style: { backgroundColor: "rgba(245,245,242,0.07)" },
    },
    {
      label: "Groceries, retirement",
      value: `${formatMultiplier(summary.groceryMultiplier)} / ${formatSignedYears(summary.retirementYearsLost)} yrs`,
      style: { border: `${u(1)}px solid ${accent}80` },
    },
  ];
  const tile = (entry: (typeof tiles)[number]) => (
    <div
      key={entry.label}
      style={column({
        flex: 1,
        minHeight: u(96),
        justifyContent: "space-between",
        borderRadius: u(12),
        padding: u(12),
        ...entry.style,
      })}
    >
      <span style={{ fontSize: u(11), opacity: 0.75 }}>{entry.label}</span>
      <span style={{ fontSize: u(20), fontWeight: 600, letterSpacing: -u(0.4) }}>{entry.value}</span>
    </div>
  );
  return (
    <div style={column({ gap: u(8) })}>
      <div style={row({ gap: u(8) })}>{tiles.slice(0, 2).map(tile)}</div>
      <div style={row({ gap: u(8) })}>{tiles.slice(2).map(tile)}</div>
    </div>
  );
}

type CardKind = StoryCards[number]["kind"];

const VISUALS: Record<CardKind, (props: VisualProps) => ReactNode> = {
  dollar_value: DollarVisual,
  housing: HousingVisual,
  groceries: ReceiptVisual,
  land: LandVisual,
  min_wage_car: DivergenceVisual,
  retirement: RetirementVisual,
  summary: SummaryVisual,
};

interface CopyWord {
  text: string;
  emphasis: boolean;
  spaceAfter: boolean;
}

/**
 * Satori cannot wrap text across sibling spans, so copy is laid out word by word in a wrapping row.
 * Spaces become trailing margins, which disappear at line ends instead of indenting the next line.
 */
function toWords(segments: CopySegment[]): CopyWord[] {
  const words: CopyWord[] = [];
  for (const segment of segments) {
    for (const token of segment.text.split(/(\s+)/)) {
      if (!token) continue;
      const previous = words[words.length - 1];
      if (/^\s+$/.test(token)) {
        if (previous) previous.spaceAfter = true;
        continue;
      }
      words.push({ text: token, emphasis: segment.emphasis, spaceAfter: false });
    }
  }
  return words;
}

function Copy({ segments, size, accent }: { segments: CopySegment[]; size: number; accent: string }) {
  return (
    <div style={row({ flexWrap: "wrap", fontSize: size, lineHeight: 1.3, color: INK_MUTED })}>
      {toWords(segments).map((word, index) => (
        <span
          key={index}
          style={{
            marginRight: word.spaceAfter ? size * WORD_SPACE_EM : 0,
            ...(word.emphasis && {
              color: INK,
              fontWeight: 600,
              backgroundImage: `linear-gradient(transparent 72%, ${accent}61 72%)`,
            }),
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
}

const fitHeroSize = (text: string, maxWidth: number, maxSize: number) =>
  Math.min(maxSize, maxWidth / (text.length * HERO_GLYPH_WIDTH_EM));

interface OgCardProps {
  slide: StorySlideContent;
  result: ComparisonResult;
  format: OgFormat;
}

export function OgCard({ slide, result, format }: OgCardProps) {
  const spec = FORMAT_SPECS[format];
  const theme = AURA_THEMES[slide.aura];
  const u = (px: number) => px * spec.unit;
  const card = result.cards[slide.id - 1];
  const Visual = VISUALS[card.kind];

  const text = (
    <div style={column({ width: spec.textWidth, flexShrink: 0 })}>
      <span style={{ fontFamily: MONO, fontSize: spec.eyebrowSize, letterSpacing: spec.eyebrowSize * 0.14, color: INK_MUTED }}>
        {slide.eyebrow}
      </span>
      <span
        style={{
          marginTop: spec.eyebrowSize * 1.2,
          fontSize: fitHeroSize(slide.heroStat, spec.textWidth, spec.heroMaxSize),
          fontWeight: 600,
          lineHeight: 0.95,
          letterSpacing: "-0.05em",
          color: theme.accent,
        }}
      >
        {slide.heroStat}
      </span>
      <span style={{ marginTop: spec.captionSize * 0.4, fontSize: spec.captionSize, color: INK_MUTED }}>{slide.heroCaption}</span>
      <div style={row({ marginTop: spec.copySize * 0.8 })}>
        <Copy segments={slide.copy} size={spec.copySize} accent={theme.accent} />
      </div>
    </div>
  );
  const visual = (
    <div style={column({ flex: 1, justifyContent: "center", width: spec.visualWidth })}>
      <Visual result={result} accent={theme.accent} u={u} width={spec.visualWidth} />
    </div>
  );
  const footer = (
    <span style={{ fontFamily: MONO, fontSize: spec.footerSize, letterSpacing: spec.footerSize * 0.12, color: INK_MUTED }}>
      {slide.source.toUpperCase()}
    </span>
  );

  return (
    <div
      style={column({
        width: "100%",
        height: "100%",
        padding: spec.padding,
        backgroundColor: theme.background,
        color: INK,
        fontFamily: "Geist",
      })}
    >
      {spec.direction === "column" ? (
        <div style={column({ flex: 1 })}>
          {text}
          {visual}
        </div>
      ) : (
        <div style={row({ flex: 1, gap: 48, alignItems: "stretch" })}>
          {text}
          {visual}
        </div>
      )}
      <div style={row({ marginTop: spec.padding * 0.4 })}>{footer}</div>
    </div>
  );
}
