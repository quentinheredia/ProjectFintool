import type { ReactNode } from "react";
import type { ComparisonResult, StoryCards } from "@/lib/comparator-engine";
import type { StorySlideContent } from "@/lib/story-content";
import { CardShell } from "./CardShell";
import { DivergenceChart } from "./visuals/DivergenceChart";
import { DollarErosion } from "./visuals/DollarErosion";
import { KeysTimeline } from "./visuals/KeysTimeline";
import { LaborReceipt } from "./visuals/LaborReceipt";
import { LandDots } from "./visuals/LandDots";
import { RetirementBar } from "./visuals/RetirementBar";
import { SummaryBento } from "./visuals/SummaryBento";

type CardKind = StoryCards[number]["kind"];
type CardOfKind<Kind extends CardKind> = Extract<StoryCards[number], { kind: Kind }>;
type VisualRenderer<Kind extends CardKind> = (card: CardOfKind<Kind>, result: ComparisonResult) => ReactNode;

const VISUALS: { [Kind in CardKind]: VisualRenderer<Kind> } = {
  dollar_value: (card, { meta }) => (
    <DollarErosion thenYear={meta.benchmarkYear} dollarValueLossPct={card.dollarValueLossPct} />
  ),
  housing: (card, { meta }) => (
    <KeysTimeline
      thenYear={meta.benchmarkYear}
      yearsToSaveThen={card.yearsToSaveThen}
      yearsToSaveNow={card.yearsToSaveNow}
    />
  ),
  groceries: (_, { meta, charts }) => (
    <LaborReceipt receipt={charts.laborReceipt} thenYear={meta.benchmarkYear} nowYear={meta.currentYear} />
  ),
  land: (card, { meta }) => (
    <LandDots thenYear={meta.benchmarkYear} hoursThen={card.hoursThen} hoursNow={card.hoursNowUser} />
  ),
  min_wage_car: (_, { meta, charts }) => <DivergenceChart points={charts.divergence} thenYear={meta.benchmarkYear} />,
  retirement: (card, { meta }) => (
    <RetirementBar
      thenYear={meta.benchmarkYear}
      retirementAgeThen={card.retirementAgeThen}
      retirementAgeNow={card.retirementAgeNow}
    />
  ),
  summary: (card, { meta }) => <SummaryBento summary={card} thenYear={meta.benchmarkYear} />,
};

function renderVisual<Kind extends CardKind>(card: CardOfKind<Kind>, result: ComparisonResult): ReactNode {
  return (VISUALS[card.kind] as VisualRenderer<Kind>)(card, result);
}

interface StorySlideProps {
  slide: StorySlideContent;
  result: ComparisonResult;
}

export function StorySlide({ slide, result }: StorySlideProps) {
  const card = result.cards[slide.id - 1];
  const isPreliminary = result.meta.includesEstimates && (card.kind === "dollar_value" || card.kind === "summary");
  return (
    <CardShell
      slide={slide}
      visual={renderVisual(card, result)}
      footnote={isPreliminary ? `${result.meta.currentYear} figures are preliminary, year-to-date data.` : undefined}
    />
  );
}
