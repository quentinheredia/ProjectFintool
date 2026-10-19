import type { Aura, ComparisonResult, StoryCards } from "./comparator-engine";
import {
  formatMinutes,
  formatMultiplier,
  formatOneDecimal,
  formatPercent,
  formatSignedPercent,
  formatSignedYears,
  formatUsd,
  formatUsdCompact,
  formatWholeNumber,
} from "./format";

export interface CopySegment {
  text: string;
  emphasis: boolean;
}

/** The text layers of one story card, shared by the web carousel and the OG image renderer. */
export interface StorySlideContent {
  id: number;
  aura: Aura;
  eyebrow: string;
  heroStat: string;
  heroCaption: string;
  copy: CopySegment[];
  source: string;
}

type Card<Id extends number> = Extract<StoryCards[number], { id: Id }>;

interface SlideContext {
  result: ComparisonResult;
  thenYear: number;
  nowYear: number;
}

const emphasis = (text: string): CopySegment => ({ text, emphasis: true });

/** Template tag that turns `${emphasis("x")}` holes into highlighted spans and plain holes into text. */
function madLibs(strings: TemplateStringsArray, ...values: (string | CopySegment)[]): CopySegment[] {
  const segments: CopySegment[] = [];
  strings.forEach((text, index) => {
    if (text) segments.push({ text, emphasis: false });
    const value = values[index];
    if (value === undefined) return;
    segments.push(typeof value === "string" ? { text: value, emphasis: false } : value);
  });
  return segments;
}

const SITE = "parity.app";
const sourceLine = (sources: string) => `Source: ${sources} • ${SITE}`;

function dollarSlide({ result, thenYear }: SlideContext, card: Card<1>) {
  const standing = card.cpiParityGap >= 0 ? "more" : "less";
  return {
    heroStat: `-${formatPercent(card.dollarValueLossPct)}`,
    heroCaption: `of a ${thenYear} dollar's value, lost to inflation`,
    copy: madLibs`Your ${emphasis(formatUsd(result.meta.income))} buys what ${emphasis(formatUsd(card.equivalentPastSalary))} did in ${String(thenYear)}. That's ${emphasis(`${formatUsdCompact(Math.abs(card.cpiParityGap))} ${standing}`)} than a median full-time ${String(thenYear)} paycheck, after inflation.`,
    source: sourceLine("BLS CPI-U, BLS earnings"),
  };
}

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

function housingSlide({ thenYear }: SlideContext, card: Card<2>) {
  // Derived from the rounded figures quoted in the copy, so "6.7 vs 5.9" reads as "+0.8", never "+0.9".
  const shownExtraYears = roundToTenth(card.yearsToSaveNow) - roundToTenth(card.yearsToSaveThen);
  const isHarder = shownExtraYears >= 0;
  return {
    heroStat: `${formatSignedYears(shownExtraYears)} YRS`,
    heroCaption: `${isHarder ? "more" : "fewer"} years saving for a starter home`,
    copy: madLibs`Saving 15% toward a 20% down payment takes you ${emphasis(`${formatOneDecimal(card.yearsToSaveNow)} years`)}. A ${String(thenYear)} peer needed ${emphasis(formatOneDecimal(card.yearsToSaveThen))}.`,
    source: sourceLine("Census/HUD home prices, BLS earnings"),
  };
}

function grocerySlide({ thenYear }: SlideContext, card: Card<3>) {
  return {
    heroStat: formatMultiplier(card.nominalMultiplier),
    heroCaption: `the cash price of milk and eggs vs ${thenYear}`,
    copy: madLibs`They took ${emphasis(`${formatMinutes(card.minutesWorkedThen)} min`)} of average work in ${String(thenYear)}. Today they take ${emphasis(`${formatMinutes(card.minutesWorkedNowUser)} min`)} of yours.`,
    source: sourceLine("BLS average prices, BLS hourly earnings"),
  };
}

function landSlide({ thenYear }: SlideContext, card: Card<4>) {
  const wasEasierThen = card.effortReductionPctIfBornThen >= 0;
  const reductionToday = (1 - card.hoursNowUser / card.hoursThen) * 100;
  return {
    heroStat: formatPercent(wasEasierThen ? card.effortReductionPctIfBornThen : reductionToday),
    heroCaption: wasEasierThen ? `less work to own land in ${thenYear}` : "less work for you to own land today",
    copy: madLibs`A quarter-acre lot took ${emphasis(`${formatWholeNumber(card.hoursThen)} hours`)} of median work in ${String(thenYear)}. Today it takes ${emphasis(`${formatWholeNumber(card.hoursNowUser)} hours`)} of yours.`,
    source: sourceLine("Lincoln Institute, NAHB lot values (modeled)"),
  };
}

function minWageCarSlide({ thenYear }: SlideContext, card: Card<5>) {
  return {
    heroStat: `${formatWholeNumber(card.minWageHoursForUsedCarNow)} HRS`,
    heroCaption: "of minimum-wage work for a used car",
    copy: madLibs`Since ${String(thenYear)}, minimum wage rose ${emphasis(formatSignedPercent(card.minWageGrowthPct))} while used cars rose ${emphasis(formatSignedPercent(card.usedCarGrowthPct))}. A car took ${emphasis(`${formatWholeNumber(card.minWageHoursForUsedCarThen)} hours`)} then.`,
    source: sourceLine("DOL minimum wage, NADA/Edmunds (modeled)"),
  };
}

function retirementSlide({ thenYear }: SlideContext, card: Card<6>) {
  return {
    heroStat: `${formatSignedYears(card.yearsLost)} YRS`,
    heroCaption: `${card.yearsLost >= 0 ? "later" : "earlier"} average retirement`,
    copy: madLibs`Workers retired at ${emphasis(formatOneDecimal(card.retirementAgeThen))} on average in ${String(thenYear)}. Today the average is ${emphasis(formatOneDecimal(card.retirementAgeNow))}.`,
    source: sourceLine("Boston College CRR (modeled)"),
  };
}

function summarySlide({ thenYear }: SlideContext, card: Card<7>) {
  const isDeficit = card.purchasingPowerDeltaPct < 0;
  return {
    heroStat: formatSignedPercent(card.purchasingPowerDeltaPct),
    heroCaption: `buying power vs a ${thenYear} peer`,
    copy: madLibs`Across money, housing, groceries and land, you have ${emphasis(`${formatPercent(card.purchasingPowerDeltaPct)} ${isDeficit ? "less" : "more"}`)} buying power than a median ${String(thenYear)} earner.`,
    source: sourceLine("BLS, FRED, Census"),
  };
}

const SLIDE_TITLES = [
  "THE DOLLAR",
  "HOUSING GRIND",
  "GROCERY RECEIPT",
  "OWNING LAND",
  "WAGES VS WHEELS",
  "FINISH LINE",
  "PARITY WRAPPED",
] as const;

export const STORY_LENGTH = SLIDE_TITLES.length;

export function buildStorySlides(result: ComparisonResult): StorySlideContent[] {
  const context: SlideContext = {
    result,
    thenYear: result.meta.benchmarkYear,
    nowYear: result.meta.currentYear,
  };
  const [dollar, housing, groceries, land, minWageCar, retirement, summary] = result.cards;
  const bodies = [
    dollarSlide(context, dollar),
    housingSlide(context, housing),
    grocerySlide(context, groceries),
    landSlide(context, land),
    minWageCarSlide(context, minWageCar),
    retirementSlide(context, retirement),
    summarySlide(context, summary),
  ];
  return bodies.map((body, index) => ({
    id: index + 1,
    aura: result.cards[index].verdict.aura,
    eyebrow: `${String(index + 1).padStart(2, "0")} / ${SLIDE_TITLES[index]} • ${context.thenYear} VS ${context.nowYear}`,
    ...body,
  }));
}
