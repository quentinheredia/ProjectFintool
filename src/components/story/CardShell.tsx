import type { CSSProperties, ReactNode } from "react";
import { AURA_THEMES } from "@/lib/aura";
import type { StorySlideContent } from "@/lib/story-content";
import { MadLibsCopy } from "./MadLibsCopy";

export function auraStyle(aura: StorySlideContent["aura"]): CSSProperties {
  const theme = AURA_THEMES[aura];
  return {
    "--aura-bg": theme.background,
    "--aura-accent": theme.accent,
    "--aura-on-accent": theme.onAccent,
  } as CSSProperties;
}

interface CardShellProps {
  slide: StorySlideContent;
  visual: ReactNode;
  footnote?: string;
  /** Rendered last, under the source line; the deck puts its closing call to action here. */
  action?: ReactNode;
}

/** The 4-layer card anatomy: eyebrow, hero stat, mad-libs copy, then micro-visual and source footer. */
export function CardShell({ slide, visual, footnote, action }: CardShellProps) {
  return (
    <article
      style={auraStyle(slide.aura)}
      className="@container flex h-full flex-col bg-aura px-6 pt-20 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-ink"
    >
      <p className="font-mono text-[11px] tracking-[0.14em] text-ink-muted uppercase">{slide.eyebrow}</p>

      <div className="mt-5">
        <p className="text-[clamp(3rem,19cqi,5.25rem)] leading-[0.92] font-semibold tracking-tighter text-accent">
          {slide.heroStat}
        </p>
        <p className="mt-2 text-base text-ink-muted">{slide.heroCaption}</p>
      </div>

      <p className="mt-5 max-w-[34ch] text-lg leading-snug text-ink-muted">
        <MadLibsCopy copy={slide.copy} />
      </p>

      <div className="flex flex-1 flex-col justify-center pt-6">{visual}</div>

      <footer className="mt-5 font-mono text-[10px] tracking-[0.12em] text-ink-muted uppercase">
        <p>{slide.source}</p>
        {footnote && <p className="mt-1 normal-case tracking-normal">{footnote}</p>}
      </footer>
      {action && <div className="mt-5">{action}</div>}
    </article>
  );
}
