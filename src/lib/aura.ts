import type { Aura } from "./comparator-engine";

export interface AuraTheme {
  background: string;
  accent: string;
  /** Text color for content placed on a solid accent fill. */
  onAccent: string;
}

/** Deficit, everyday friction, and surplus palettes. Shared by the web deck and the OG renderer. */
export const AURA_THEMES: Record<Aura, AuraTheme> = {
  crimson: { background: "#0A0A0A", accent: "#FF3366", onAccent: "#0A0A0A" },
  amber: { background: "#0F172A", accent: "#FFB800", onAccent: "#0F172A" },
  emerald: { background: "#061E16", accent: "#10B981", onAccent: "#061E16" },
};

export const INK = "#F5F5F2";
export const INK_MUTED = "rgba(245, 245, 242, 0.66)";
