"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Share2, X } from "lucide-react";
import { AURA_THEMES } from "@/lib/aura";
import { inputFromMeta, type ComparisonResult } from "@/lib/comparator-engine";
import type { StorySlideContent } from "@/lib/story-content";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { ModeSwitcher } from "./ModeSwitcher";
import { ShareModal } from "./ShareModal";
import { StorySlide } from "./story/StorySlide";

const AUTOPLAY_SECONDS = 8;
const PREVIOUS_TAP_ZONE = 0.3;
const ROUND_CONTROL_CLASS =
  "flex size-8 items-center justify-center rounded-full bg-ink/12 text-ink backdrop-blur-md transition hover:bg-ink/20 focus-visible:outline-2 focus-visible:outline-ink";
const INTERACTIVE_SELECTOR = "button, a, select, input, label, [data-interactive]";

/** Where the story leads once the last card is reached. */
export interface StoryFinale {
  label: string;
  href: string;
}

interface StoryCarouselProps {
  result: ComparisonResult;
  slides: StorySlideContent[];
  finale: StoryFinale;
  /** A short label beside the controls, e.g. "Sample". */
  note?: string;
}

function FinaleLink({ label, href }: StoryFinale) {
  return (
    <Link
      href={href}
      className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-base font-semibold text-on-accent transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98]"
    >
      {label}
      <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
    </Link>
  );
}

function ProgressSegments({
  count,
  selected,
  isAutoplaying,
  isPaused,
  onSegmentComplete,
}: {
  count: number;
  selected: number;
  isAutoplaying: boolean;
  isPaused: boolean;
  onSegmentComplete: () => void;
}) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === selected;
        const isFilled = index < selected || (isActive && !isAutoplaying);
        return (
          <span key={index} className="h-[3px] flex-1 overflow-hidden rounded-full bg-ink/25">
            {isFilled && <span className="block h-full bg-ink" />}
            {isActive && isAutoplaying && (
              <span
                key={selected}
                className="block h-full origin-left bg-ink"
                style={{
                  animation: `segment-fill ${AUTOPLAY_SECONDS}s linear forwards`,
                  animationPlayState: isPaused ? "paused" : "running",
                }}
                onAnimationEnd={onSegmentComplete}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

function NavButton({ direction, onClick, disabled }: { direction: "previous" | "next"; onClick: () => void; disabled: boolean }) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "previous" ? "Previous card" : "Next card"}
      className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-ink/10 text-ink transition hover:bg-ink/20 focus-visible:outline-2 focus-visible:outline-ink active:scale-95 disabled:opacity-30 md:flex"
    >
      <Icon className="size-5" strokeWidth={2} aria-hidden />
    </button>
  );
}

export function StoryCarousel({ result, slides, finale, note }: StoryCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    watchDrag: (_, event) => !(event.target instanceof Element && event.target.closest("[data-no-drag]")),
  });
  const [selected, setSelected] = useState(0);
  const [userTookControl, setUserTookControl] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const isAutoAdvancing = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const lastIndex = slides.length - 1;
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const canAutoplay = !prefersReducedMotion && !userTookControl && selected < lastIndex;

  useEffect(() => {
    if (!emblaApi) return;
    const syncSelection = () => {
      setSelected(emblaApi.selectedScrollSnap());
      if (!isAutoAdvancing.current) setUserTookControl(true);
      isAutoAdvancing.current = false;
    };
    emblaApi.on("select", syncSelection);
    return () => {
      emblaApi.off("select", syncSelection);
    };
  }, [emblaApi]);

  const goManually = useCallback(
    (direction: -1 | 1) => {
      setUserTookControl(true);
      if (direction < 0) emblaApi?.scrollPrev();
      else emblaApi?.scrollNext();
    },
    [emblaApi],
  );

  const advanceAutomatically = useCallback(() => {
    isAutoAdvancing.current = true;
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isShareOpen || event.defaultPrevented || event.target instanceof HTMLSelectElement) return;
      if (event.key === "ArrowLeft") goManually(-1);
      if (event.key === "ArrowRight") goManually(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goManually, isShareOpen]);

  function onTap(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    goManually(event.clientX - bounds.left < bounds.width * PREVIOUS_TAP_ZONE ? -1 : 1);
  }

  const activeSlide = slides[selected];
  const { meta } = result;

  return (
    <main
      className="min-h-[100dvh] transition-colors duration-700"
      style={{ backgroundColor: AURA_THEMES[activeSlide.aura].background }}
    >
      <div className="flex min-h-[100dvh] items-center justify-center md:gap-8 md:py-6">
        <NavButton direction="previous" onClick={() => goManually(-1)} disabled={selected === 0} />

        <section
          aria-roledescription="carousel"
          aria-label="Your Parity story"
          data-carousel-ready={emblaApi ? true : undefined}
          className="relative h-[100dvh] w-full overflow-hidden md:aspect-[9/16] md:h-[min(calc(100dvh-3rem),880px)] md:w-auto md:rounded-3xl md:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] md:ring-1 md:ring-ink-faint"
        >
          <div
            ref={emblaRef}
            className="h-full touch-manipulation overflow-hidden [-webkit-tap-highlight-color:transparent]"
            onClick={onTap}
            onPointerDown={() => setIsHeld(true)}
            onPointerUp={() => setIsHeld(false)}
            onPointerCancel={() => setIsHeld(false)}
            onPointerLeave={() => setIsHeld(false)}
          >
            <div className="flex h-full touch-pan-y">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${slides.length}`}
                  aria-hidden={index !== selected}
                  inert={index !== selected}
                  className="h-full min-w-0 flex-[0_0_100%]"
                >
                  <StorySlide
                    slide={slide}
                    result={result}
                    action={index === lastIndex ? <FinaleLink {...finale} /> : undefined}
                  />
                </div>
              ))}
            </div>
          </div>

          <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <ProgressSegments
              count={slides.length}
              selected={selected}
              isAutoplaying={canAutoplay}
              isPaused={isHeld || isPausedByUser || isShareOpen}
              onSegmentComplete={advanceAutomatically}
            />
            <div className="pointer-events-auto mt-3 flex items-center gap-2">
              <ModeSwitcher meta={meta} />
              <span className="min-w-0 flex-1 truncate text-center font-mono text-[10px] tracking-[0.12em] text-ink-muted uppercase">
                {note}
              </span>
              {canAutoplay && (
                <button
                  type="button"
                  onClick={() => setIsPausedByUser((paused) => !paused)}
                  aria-label={isPausedByUser ? "Resume story" : "Pause story"}
                  className={ROUND_CONTROL_CLASS}
                >
                  {isPausedByUser ? <Play className="size-3.5" strokeWidth={2} aria-hidden /> : <Pause className="size-3.5" strokeWidth={2} aria-hidden />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                aria-label="Share this card"
                className={ROUND_CONTROL_CLASS}
              >
                <Share2 className="size-4" strokeWidth={2} aria-hidden />
              </button>
              <Link
                href="/"
                aria-label="Start a new comparison"
                className={ROUND_CONTROL_CLASS}
              >
                <X className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            </div>
            {meta.clampedYear !== null && (
              <p className="mt-2 font-mono text-[10px] text-ink-muted">
                Showing {meta.clampedYear}: {meta.requestedBenchmarkYear} is outside our data range.
              </p>
            )}
          </header>
          <div className="sr-only md:hidden">
            <button type="button" onClick={() => goManually(-1)} disabled={selected === 0}>
              Previous card
            </button>
            <button type="button" onClick={() => goManually(1)} disabled={selected === lastIndex}>
              Next card
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            Card {selected + 1} of {slides.length}: {activeSlide.eyebrow}
          </p>
        </section>

        <NavButton direction="next" onClick={() => goManually(1)} disabled={selected === lastIndex} />
      </div>

      <ShareModal
        input={inputFromMeta(meta)}
        cardId={activeSlide.id}
        cardTitle={activeSlide.eyebrow}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </main>
  );
}
