import type { CopySegment } from "@/lib/story-content";

/** Mad-libs copy with each emphasised span over the aura's highlighter. Reads `--aura-accent` from an ancestor. */
export function MadLibsCopy({ copy }: { copy: CopySegment[] }) {
  return copy.map((segment, index) =>
    segment.emphasis ? (
      <span
        key={index}
        className="bg-[linear-gradient(transparent_62%,color-mix(in_srgb,var(--aura-accent)_38%,transparent)_62%)] font-semibold text-ink"
      >
        {segment.text}
      </span>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}
