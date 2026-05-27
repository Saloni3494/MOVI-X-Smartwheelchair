import type { MoviState } from "./types";

const LABELS: Record<MoviState, { text: string; color: string }> = {
  idle: { text: "READY", color: "oklch(0.78 0.15 190)" },
  listening: { text: "LISTENING…", color: "oklch(0.85 0.2 200)" },
  thinking: { text: "PROCESSING REQUEST…", color: "oklch(0.7 0.22 295)" },
  speaking: { text: "MOVI IS SPEAKING", color: "oklch(0.85 0.2 200)" },
  emergency: { text: "⚠ SAFETY MODE ACTIVATED", color: "oklch(0.68 0.26 22)" },
};

export function StatusBadge({ state }: { state: MoviState }) {
  const { text, color } = LABELS[state];
  return (
    <div
      className="px-5 py-2 rounded-full font-display tracking-[0.35em] text-xs transition-all"
      style={{
        background: "oklch(0.18 0.025 240 / 0.7)",
        border: `1.5px solid ${color}`,
        color,
        boxShadow: `0 0 16px ${color.replace(")", " / 0.5)")}`,
        backdropFilter: "blur(12px)",
      }}
    >
      {text}
    </div>
  );
}
