import {
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Square,
  Siren,
  Mic,
  MicOff,
} from "lucide-react";
import type { MoviState } from "./types";

interface Props {
  state: MoviState;
  onMic: () => void;
  onCommand: (cmd: string) => void;
}

const NAV_BUTTONS = [
  { id: "forward", label: "Forward", icon: ArrowUp },
  { id: "left", label: "Left", icon: ArrowLeft },
  { id: "stop", label: "Stop", icon: Square },
  { id: "right", label: "Right", icon: ArrowRight },
];

export function ControlPanel({ state, onMic, onCommand }: Props) {
  const listening = state === "listening";

  return (
    <div className="flex flex-col gap-4">
      {/* Mic + status */}
      <div className="flex items-center gap-4 p-4 rounded-3xl glass">
        <button
          onClick={onMic}
          aria-label={listening ? "Stop listening" : "Activate Movi"}
          className="relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300"
          style={{
            background: listening
              ? "radial-gradient(circle, oklch(0.85 0.2 200) 0%, oklch(0.5 0.18 220) 100%)"
              : "linear-gradient(135deg, oklch(0.3 0.06 240), oklch(0.2 0.04 240))",
            boxShadow: listening
              ? "0 0 32px oklch(0.85 0.2 200 / 0.8)"
              : "0 0 16px oklch(0.85 0.2 200 / 0.2)",
            border: "1.5px solid oklch(0.85 0.2 200 / 0.6)",
          }}
        >
          {listening ? (
            <Mic className="w-9 h-9 text-background" />
          ) : (
            <MicOff className="w-9 h-9 text-cyan-glow" />
          )}
          {listening && (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-cyan-glow animate-pulse-ring" />
              <span
                className="absolute inset-0 rounded-full border-2 border-cyan-glow animate-pulse-ring"
                style={{ animationDelay: "0.6s" }}
              />
            </>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-display tracking-[0.3em] text-muted-foreground">
            WAKE WORD
          </div>
          <div className="text-2xl font-display font-bold text-cyan-glow text-glow-cyan">
            "Hey Movi"
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                state === "emergency"
                  ? "bg-destructive animate-pulse"
                  : "bg-cyan-glow animate-pulse"
              }`}
              style={{
                boxShadow:
                  state === "emergency"
                    ? "0 0 8px oklch(0.68 0.26 22)"
                    : "0 0 8px oklch(0.85 0.2 200)",
              }}
            />
            <span className="text-xs text-muted-foreground font-display tracking-widest uppercase">
              {state === "idle" && "Standing by · Always listening"}
              {state === "listening" && "Listening to you…"}
              {state === "thinking" && "Processing request…"}
              {state === "speaking" && "Movi is speaking"}
              {state === "emergency" && "Safety mode active"}
            </span>
          </div>
        </div>
      </div>

      {/* Nav grid */}
      <div className="grid grid-cols-4 gap-3">
        {NAV_BUTTONS.map((b) => {
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              onClick={() => onCommand(b.label)}
              aria-label={b.label}
              className="group flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl glass hover:bg-card/80 active:scale-95 transition-all"
              style={{ minHeight: 72 }}
            >
              <Icon className="w-7 h-7 text-cyan-glow group-hover:scale-110 transition-transform" />
              <span className="text-xs font-display tracking-wider text-foreground/80">
                {b.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {/* SOS */}
      <button
        onClick={() => onCommand("Emergency SOS")}
        className="flex items-center justify-center gap-3 py-4 rounded-2xl font-display font-bold tracking-[0.3em] text-base transition-all active:scale-[0.98]"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.55 0.25 25), oklch(0.4 0.2 18))",
          color: "white",
          border: "1.5px solid oklch(0.7 0.26 22)",
          boxShadow: "0 0 24px oklch(0.68 0.26 22 / 0.5)",
        }}
      >
        <Siren className="w-6 h-6" />
        EMERGENCY SOS
      </button>
    </div>
  );
}
