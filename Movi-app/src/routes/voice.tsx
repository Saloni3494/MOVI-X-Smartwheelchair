import { createFileRoute } from "@tanstack/react-router";
import { useRef, useEffect, useState } from "react";
import { Mic, MicOff, Home as HomeIcon, Navigation2, Phone, Sparkles } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { RobotAvatar } from "@/components/RobotAvatar";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";

export const Route = createFileRoute("/voice")({
  component: Voice,
});

const suggestions = [
  { icon: HomeIcon, text: "Take me home", cmd: "move forward" },
  { icon: Navigation2, text: "Start safe navigation", cmd: "voice mode" },
  { icon: Phone, text: "Call emergency contact", cmd: "emergency" },
];

function Voice() {
  const { isListening, voiceMessages, isSupported, toggleListening, speak } =
    useVoiceCommands();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [voiceMessages.length]);

  return (
    <div className="flex min-h-dvh flex-col">
      <ScreenHeader title="AI Assistant" subtitle={isListening ? "Listening..." : "Always listening"} />

      {/* Chat messages — live from voice commands */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5">
        {voiceMessages.map((msg) =>
          msg.from === 'user' ? (
            <Bubble key={msg.id} from="user">{msg.text}</Bubble>
          ) : (
            <Bubble key={msg.id} from="bot">{msg.text}</Bubble>
          )
        )}
      </div>

      {/* Suggestions — now trigger real commands */}
      <div className="px-5 pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Try saying
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {suggestions.map(({ icon: Icon, text }) => (
            <button
              key={text}
              onClick={() => speak(text)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2 text-xs font-semibold shadow-soft active:scale-95 transition-transform"
            >
              <Icon className="h-4 w-4 text-primary" />
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* Voice waveform + mic button */}
      <div className="relative flex flex-col items-center px-5 pb-8 pt-6">
        <div className="flex items-end gap-1.5">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 origin-bottom rounded-full bg-gradient-primary ${
                isListening ? 'animate-wave' : ''
              }`}
              style={{
                height: isListening
                  ? `${20 + Math.abs(Math.sin(i)) * 38}px`
                  : '8px',
                animationDelay: `${i * 0.08}s`,
                transition: 'height 0.3s ease',
              }}
            />
          ))}
        </div>

        <button
          onClick={toggleListening}
          disabled={!mounted || !isSupported}
          aria-label={isListening ? "Stop listening" : "Tap to speak"}
          className={`relative mt-6 flex h-24 w-24 items-center justify-center rounded-full text-primary-foreground shadow-glow active:scale-[0.96] transition-all ${
            isListening
              ? 'bg-gradient-sos'
              : 'bg-gradient-primary'
          } ${!mounted || !isSupported ? 'opacity-50' : ''}`}
        >
          {isListening && (
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/40" />
          )}
          {!isListening && (
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />
          )}
          {isListening ? (
            <MicOff className="relative h-10 w-10" strokeWidth={2.4} />
          ) : (
            <Mic className="relative h-10 w-10" strokeWidth={2.4} />
          )}
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          {!mounted || !isSupported
            ? 'Voice not supported in this browser'
            : isListening
              ? 'Listening — say a command...'
              : 'Tap to speak'}
        </p>
      </div>
    </div>
  );
}

function Bubble({ from, children }: { from: "user" | "bot"; children: React.ReactNode }) {
  if (from === "user") {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[75%] rounded-3xl rounded-tr-md bg-gradient-primary px-4 py-3 text-sm text-primary-foreground shadow-soft">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2 animate-fade-up">
      <RobotAvatar size={36} />
      <div className="max-w-[75%] rounded-3xl rounded-tl-md bg-surface-elevated px-4 py-3 text-sm shadow-soft">
        <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary">
          <Sparkles className="h-3 w-3" />
          MOVI-X AI
        </div>
        {children}
      </div>
    </div>
  );
}
