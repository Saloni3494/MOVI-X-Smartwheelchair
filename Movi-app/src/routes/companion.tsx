import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MoviFace } from "@/components/movi-face/MoviFace";
import { ControlPanel } from "@/components/movi-face/ControlPanel";
import { StatusBadge } from "@/components/movi-face/StatusBadge";
import { Particles } from "@/components/movi-face/Particles";
import type { MoviState } from "@/components/movi-face/types";
import { useWheelchairStore } from "@/store/wheelchairStore";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import * as hardwareService from "@/services/hardwareService";
import type { MovementCommand } from "@/utils/commandParser";

export const Route = createFileRoute("/companion")({
  component: CompanionScreen,
});

function CompanionScreen() {
  const telemetry = useWheelchairStore((s) => s.telemetry);
  const { isListening, toggleListening, speak, voiceMessages } = useVoiceCommands();
  const [internalState, setInternalState] = useState<MoviState>("idle");
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Derive the Movi Face state from real hardware and voice state
  let derivedState: MoviState = "idle";
  if (telemetry.emergency) {
    derivedState = "emergency";
  } else if (isListening) {
    derivedState = "listening";
  } else if (internalState === "thinking" || internalState === "speaking") {
    // Preserve internal thinking/speaking animations briefly after a command is processed
    derivedState = internalState;
  }

  // Effect to simulate "thinking" and "speaking" when a new bot message arrives
  useEffect(() => {
    if (voiceMessages.length > lastMessageCount) {
      const lastMsg = voiceMessages[voiceMessages.length - 1];
      if (lastMsg.from === "bot") {
        setInternalState("speaking");
        const timer = setTimeout(() => {
          setInternalState("idle");
        }, 3000); // Movi speaks for 3 seconds
        return () => clearTimeout(timer);
      } else {
        // User spoke, Movi is "thinking"
        setInternalState("thinking");
      }
      setLastMessageCount(voiceMessages.length);
    }
  }, [voiceMessages, lastMessageCount]);

  // If external state overrides, sync internal state
  useEffect(() => {
    if (telemetry.emergency || isListening) {
      setInternalState(derivedState);
    }
  }, [telemetry.emergency, isListening, derivedState]);

  const handleCommand = useCallback((cmd: string) => {
    if (cmd === "emergency") {
      hardwareService.emergencyStop();
      return;
    }
    
    // Check if command is a movement command (forward, backward, left, right, stop)
    if (["forward", "backward", "left", "right", "stop"].includes(cmd)) {
      hardwareService.sendMovement(cmd as MovementCommand);
      return;
    }
  }, []);

  const latestUserMessage = [...voiceMessages].reverse().find(m => m.from === "user");
  const latestBotMessage = [...voiceMessages].reverse().find(m => m.from === "bot");

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-background">
      <Particles />

      <div className="relative z-10 mx-auto w-full max-w-md flex flex-col gap-4 px-4 py-4">
        {/* Face panel */}
        <div className="relative glass overflow-hidden h-[55vh] -mx-4 rounded-none sm:h-auto sm:aspect-square sm:mx-0 sm:rounded-3xl">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MoviFace state={derivedState} />
          </div>
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[10px] font-display tracking-[0.25em] text-cyan-glow/70">
            <span>SYS · ONLINE</span>
            <StatusBadge state={derivedState} />
            <span>BATT · {telemetry.battery}%</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] font-display tracking-[0.3em] text-muted-foreground">
            <span>DIST · {telemetry.distance}cm</span>
            <span>CORE · {derivedState.toUpperCase()}</span>
          </div>
        </div>

        {/* Dialog Box */}
        <div className="rounded-3xl glass p-4 min-h-[120px] flex flex-col gap-2">
          {latestUserMessage && (
            <div className="flex items-start gap-2 animate-fade-up">
              <span className="text-[9px] font-display tracking-[0.3em] text-muted-foreground mt-1 shrink-0">
                YOU
              </span>
              <p className="text-sm text-foreground/90 italic">"{latestUserMessage.text}"</p>
            </div>
          )}
          
          <div className="flex items-start gap-2 animate-fade-up">
            <span className="text-[9px] font-display tracking-[0.3em] text-cyan-glow mt-1 shrink-0">
              MOVI
            </span>
            <p
              className="text-base leading-relaxed text-foreground"
              style={{
                textShadow: derivedState === "speaking" ? "0 0 12px oklch(0.85 0.2 200 / 0.4)" : "none",
              }}
            >
              {derivedState === "thinking" ? "…" : latestBotMessage ? latestBotMessage.text : "Hello, I am Movi-X."}
            </p>
          </div>

          {derivedState === "speaking" && (
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

        {/* Hardware & Voice Controls */}
        <ControlPanel state={derivedState} onMic={toggleListening} onCommand={handleCommand} />
      </div>
    </main>
  );
}
