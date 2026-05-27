import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MoviFace } from "@/components/movi/MoviFace";
import { ControlPanel } from "@/components/movi/ControlPanel";
import { StatusBadge } from "@/components/movi/StatusBadge";
import { Particles } from "@/components/movi/Particles";
import type { MoviState } from "@/components/movi/types";

export const Route = createFileRoute("/")({
  component: MoviXInterface,
});

const RESPONSES: Record<string, string> = {
  Forward: "Moving forward. Path is clear.",
  Left: "Turning left now.",
  Right: "Turning right now.",
  Stop: "Stopping. Holding position.",
  "Emergency SOS": "Emergency mode activated. Contacting your caregiver.",
};

function MoviXInterface() {
  const [state, setState] = useState<MoviState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [response, setResponse] = useState<string>("Hello, I'm Movi. Say 'Hey Movi' to begin.");

  useEffect(() => {
    if (state !== "idle") return;
    const id = setTimeout(() => {
      runConversation("What's in front of me?", "I see a doorway ahead and a person on your left. The path is safe.");
    }, 6000);
    return () => clearTimeout(id);
  }, [state]);

  const runConversation = useCallback((heard: string, reply: string) => {
    setTranscript(heard);
    setResponse("");
    setState("listening");
    setTimeout(() => setState("thinking"), 1400);
    setTimeout(() => {
      setState("speaking");
      setResponse(reply);
    }, 2700);
    setTimeout(() => {
      setState("idle");
      setTranscript("");
    }, 5800);
  }, []);

  const handleMic = useCallback(() => {
    if (state === "listening") {
      setState("idle");
      return;
    }
    runConversation("Hey Movi…", "I'm listening. How can I help you?");
  }, [state, runConversation]);

  const handleCommand = useCallback(
    (cmd: string) => {
      if (cmd === "Emergency SOS") {
        setTranscript(cmd);
        setResponse(RESPONSES[cmd]);
        setState("emergency");
        setTimeout(() => setState("idle"), 5000);
        return;
      }
      runConversation(cmd, RESPONSES[cmd] ?? "Acknowledged.");
    },
    [runConversation]
  );

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden">
      <Particles />

      <div className="relative z-10 mx-auto w-full max-w-md flex flex-col gap-4 px-4 py-4">
        {/* Face panel — fills the screen on mobile (portrait & landscape), square on larger screens */}
        <div className="relative glass overflow-hidden h-[100dvh] -mx-4 rounded-none sm:h-auto sm:aspect-square sm:mx-0 sm:rounded-3xl">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MoviFace state={state} />
          </div>
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[10px] font-display tracking-[0.25em] text-cyan-glow/70">
            <span>SYS · ONLINE</span>
            <StatusBadge state={state} />
            <span>BATT · 87%</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-center text-[10px] font-display tracking-[0.3em] text-muted-foreground">
            EMOTIONAL CORE · {state.toUpperCase()}
          </div>
        </div>

        {/* Dialog */}
        <div className="rounded-3xl glass p-4 min-h-[140px] flex flex-col gap-2">
          {transcript && (
            <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-[9px] font-display tracking-[0.3em] text-muted-foreground mt-1 shrink-0">
                YOU
              </span>
              <p className="text-sm text-foreground/90 italic">"{transcript}"</p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-[9px] font-display tracking-[0.3em] text-cyan-glow mt-1 shrink-0">
              MOVI
            </span>
            <p
              className="text-base leading-relaxed text-foreground"
              style={{
                textShadow:
                  state === "speaking" ? "0 0 12px oklch(0.85 0.2 200 / 0.4)" : "none",
              }}
            >
              {response || (state === "thinking" ? "…" : " ")}
            </p>
          </div>

          {state === "speaking" && (
            <div className="flex items-end gap-1 h-5 mt-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-full bg-cyan-glow"
                  style={{
                    boxShadow: "0 0 6px oklch(0.85 0.2 200)",
                    height: "100%",
                    animation: `wave 0.6s ease-in-out ${i * 0.04}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <ControlPanel state={state} onMic={handleMic} onCommand={handleCommand} />
      </div>
    </main>
  );
}
