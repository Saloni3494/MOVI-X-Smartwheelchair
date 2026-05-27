import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Navigation2, Mic, Accessibility, Locate, AlertTriangle } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { MovementControls } from "@/components/MovementControls";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useESP32 } from "@/hooks/useESP32";

export const Route = createFileRoute("/navigation")({
  component: NavigationScreen,
});

function NavigationScreen() {
  const [showControls, setShowControls] = useState(false);
  const tele = useTelemetry();
  const { isConnected, changeMode } = useESP32();

  return (
    <div>
      <ScreenHeader title="Smart Navigation" subtitle="Wheelchair-safe routing" />

      <div className="px-5">
        <div className="flex h-14 items-center gap-3 rounded-2xl bg-surface-elevated px-4 shadow-card">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            placeholder="Where to?"
            className="flex-1 bg-transparent text-base focus:outline-none"
          />
          <button aria-label="Voice search" className="text-primary">
            <Mic className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Map area */}
      <div className="relative mx-5 mt-4 h-72 overflow-hidden rounded-3xl shadow-card">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,oklch(0.93_0.04_200),oklch(0.96_0.03_160))]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 300" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0H0V30" fill="none" stroke="oklch(0.85 0.03 200)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="300" height="300" fill="url(#grid)" />
          <path
            d="M40 250 Q90 180 140 170 T240 60"
            fill="none"
            stroke="oklch(0.68 0.12 195)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="0"
          />
          <circle cx="40" cy="250" r="8" fill="oklch(0.72 0.14 155)" />
          <circle cx="240" cy="60" r="8" fill="oklch(0.62 0.22 25)" />
        </svg>

        {/* GPS coordinates overlay */}
        {tele.hasGps && (
          <div className="absolute left-3 bottom-16 rounded-xl bg-surface-elevated/95 px-3 py-1.5 text-[10px] font-mono font-semibold shadow-soft backdrop-blur">
            📍 {tele.gpsCoordinates}
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button aria-label="Locate me" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-elevated shadow-card">
            <Locate className="h-5 w-5 text-primary" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-2xl bg-surface-elevated/95 px-4 py-3 shadow-card backdrop-blur">
          <div className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Accessibility</p>
              <p className="text-sm font-bold">
                {tele.isObstacleDetected ? 'Obstacle · Caution' : 'Excellent · 9.2/10'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Speed</p>
            <p className="text-sm font-bold">{tele.speedDisplay}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        {/* Alerts — driven by obstacle data */}
        <div className="grid grid-cols-2 gap-3">
          <Alert
            icon={AlertTriangle}
            title={tele.isObstacleDetected ? `Object at ${tele.distanceDisplay}` : "Path clear"}
            desc={tele.isObstacleDetected ? "Slowing down" : "No obstacles"}
            tint={tele.isObstacleDetected ? "warning" : "success"}
          />
          <Alert icon={Accessibility} title="Ramp available" desc="Use right path" tint="success" />
        </div>

        {/* Movement controls toggle */}
        {isConnected && (
          <div className="mt-4">
            <button
              onClick={() => setShowControls(!showControls)}
              className="mb-3 w-full rounded-2xl bg-surface-elevated p-3 text-center text-sm font-semibold shadow-soft"
            >
              {showControls ? 'Hide Controls' : '🕹️ Show Movement Controls'}
            </button>
            {showControls && (
              <div className="flex justify-center rounded-3xl bg-surface-elevated p-4 shadow-card">
                <MovementControls />
              </div>
            )}
          </div>
        )}

        <h3 className="mt-6 text-sm font-bold text-muted-foreground">Nearby accessible places</h3>
        <div className="mt-3 space-y-2">
          {[
            { name: "Greenpark Café", dist: "0.3 km", tag: "Step-free" },
            { name: "City Library", dist: "0.8 km", tag: "Wide doors" },
            { name: "Wellness Pharmacy", dist: "1.1 km", tag: "Auto-doors" },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-2xl bg-surface-elevated p-4 shadow-soft">
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.dist} · {p.tag}</p>
              </div>
              <Navigation2 className="h-5 w-5 text-primary" />
            </div>
          ))}
        </div>

        <button
          onClick={() => changeMode('voice')}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow active:scale-[0.98] transition-transform"
        >
          <Navigation2 className="h-5 w-5" />
          Start Voice-Guided Route
        </button>
      </div>
    </div>
  );
}

function Alert({
  icon: Icon, title, desc, tint,
}: { icon: typeof AlertTriangle; title: string; desc: string; tint: "warning" | "success" }) {
  const tints = {
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/15 text-success",
  };
  return (
    <div className="rounded-2xl bg-surface-elevated p-3 shadow-soft">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${tints[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
