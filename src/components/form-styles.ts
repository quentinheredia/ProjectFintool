export const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-ink-faint bg-ink/[0.06] px-4 text-lg text-ink placeholder:text-ink/45 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/40 aria-invalid:border-[#ff6b8a]";

export const PILL_CLASS =
  "cursor-pointer rounded-full border border-ink-faint px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand/50 touch-manipulation";

/** A pill wrapping a visually hidden radio input; the checked one is filled with the brand colour. */
export const RADIO_PILL_CLASS = `${PILL_CLASS} has-checked:border-brand has-checked:bg-brand has-checked:text-page has-focus-visible:outline-2 has-focus-visible:outline-brand/50`;
