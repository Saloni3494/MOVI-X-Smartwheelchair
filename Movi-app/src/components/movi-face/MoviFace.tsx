import { useEffect, useState } from "react";
import type { MoviState } from "./types";

interface Props {
  state: MoviState;
}

export function MoviFace({ state }: Props) {
  const [lookX, setLookX] = useState(0);
  const [lookY, setLookY] = useState(0);

  // gentle eye tracking
  useEffect(() => {
    if (state === "emergency") return;
    const id = setInterval(() => {
      setLookX((Math.random() - 0.5) * 8);
      setLookY((Math.random() - 0.5) * 4);
    }, 2200);
    return () => clearInterval(id);
  }, [state]);

  const isListening = state === "listening";
  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";
  const isEmergency = state === "emergency";

  const glowColor = isEmergency
    ? "oklch(0.68 0.26 22)"
    : isListening
    ? "oklch(0.85 0.2 200)"
    : isThinking
    ? "oklch(0.7 0.22 295)"
    : "oklch(0.85 0.2 200)";

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* ambient halo */}
      <div
        className="absolute rounded-full blur-3xl transition-all duration-700"
        style={{
          width: isListening || isSpeaking ? 360 : 280,
          height: isListening || isSpeaking ? 360 : 280,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity: isEmergency ? 0.7 : 0.4,
        }}
      />

      {/* pulse rings while listening */}
      {(isListening || isEmergency) && (
        <>
          <div
            className="absolute w-72 h-72 rounded-full border-2 animate-pulse-ring"
            style={{ borderColor: glowColor }}
          />
          <div
            className="absolute w-72 h-72 rounded-full border-2 animate-pulse-ring"
            style={{ borderColor: glowColor, animationDelay: "0.7s" }}
          />
        </>
      )}

      {/* rotating thinking ring */}
      {isThinking && (
        <div className="absolute w-80 h-80 animate-spin-slow">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, ${glowColor} 25%, transparent 50%, ${glowColor} 75%, transparent 100%)`,
              mask: "radial-gradient(circle, transparent 58%, black 60%, black 62%, transparent 64%)",
              WebkitMask: "radial-gradient(circle, transparent 58%, black 60%, black 62%, transparent 64%)",
            }}
          />
        </div>
      )}

      {/* face body */}
      <div
        className="relative flex items-center justify-center rounded-[3rem] animate-float-y transition-all duration-500"
        style={{
          width: 320,
          height: 220,
          background:
            "linear-gradient(180deg, oklch(0.22 0.04 245 / 0.9), oklch(0.16 0.03 245 / 0.9))",
          border: `1.5px solid ${glowColor}`,
          boxShadow: `0 0 60px ${glowColor.replace(")", " / 0.5)")}, inset 0 0 40px oklch(0.85 0.2 200 / 0.1)`,
        }}
      >
        {/* eyes */}
        <div className="flex gap-12 items-center">
          <Eye
            color={glowColor}
            lookX={lookX}
            lookY={lookY}
            scanning={isThinking}
            wide={isListening}
            angry={isEmergency}
          />
          <Eye
            color={glowColor}
            lookX={lookX}
            lookY={lookY}
            scanning={isThinking}
            wide={isListening}
            angry={isEmergency}
          />
        </div>

        {/* mouth / voice wave */}
        {isSpeaking && (
          <div className="absolute bottom-6 flex items-end gap-1 h-6">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span
                key={i}
                className="w-1.5 rounded-full"
                style={{
                  background: glowColor,
                  boxShadow: `0 0 8px ${glowColor}`,
                  height: "100%",
                  animation: `wave 0.5s ease-in-out ${i * 0.08}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        {/* corner accents */}
        {(["tl", "tr", "bl", "br"] as const).map((pos) => (
          <span
            key={pos}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: glowColor,
              boxShadow: `0 0 10px ${glowColor}`,
              top: pos.startsWith("t") ? 14 : "auto",
              bottom: pos.startsWith("b") ? 14 : "auto",
              left: pos.endsWith("l") ? 14 : "auto",
              right: pos.endsWith("r") ? 14 : "auto",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Eye({
  color,
  lookX,
  lookY,
  scanning,
  wide,
  angry,
}: {
  color: string;
  lookX: number;
  lookY: number;
  scanning: boolean;
  wide: boolean;
  angry: boolean;
}) {
  const height = angry ? 36 : wide ? 78 : 64;
  const width = 56;

  return (
    <div
      className="relative rounded-[1.8rem] overflow-hidden transition-all duration-500 animate-blink"
      style={{
        width,
        height,
        background: `radial-gradient(circle at 40% 35%, ${color} 0%, ${color.replace(")", " / 0.4)")} 60%, transparent 100%)`,
        boxShadow: `0 0 20px ${color}, inset 0 0 14px ${color.replace(")", " / 0.6)")}`,
        transform: angry ? "skewY(-8deg)" : "none",
      }}
    >
      {/* pupil */}
      <div
        className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-white transition-transform duration-700"
        style={{
          transform: `translate(calc(-50% + ${lookX}px), calc(-50% + ${lookY}px))`,
          boxShadow: "0 0 8px white",
        }}
      />
      {scanning && (
        <div
          className="absolute inset-x-0 h-[3px] animate-scan"
          style={{
            top: "50%",
            background: "linear-gradient(90deg, transparent, white, transparent)",
            boxShadow: "0 0 12px white",
          }}
        />
      )}
    </div>
  );
}
