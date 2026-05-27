import { createFileRoute } from "@tanstack/react-router";
import { Camera, AlertOctagon, Volume2, Pause } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useESP32 } from "@/hooks/useESP32";
import { useTelemetry } from "@/hooks/useTelemetry";

export const Route = createFileRoute("/obstacles")({
  component: Obstacles,
});

function Obstacles() {
  const { emergencyStop, isConnected } = useESP32();
  const tele = useTelemetry();

  // Build detections list from live data
  const detections = [
    {
      label: "Ultrasonic Reading",
      distance: tele.distanceDisplay,
      confidence: isConnected ? 99 : 0,
      tint: tele.distanceStatus === 'danger'
        ? 'destructive'
        : tele.distanceStatus === 'warning'
          ? 'warning'
          : 'success',
    },
    ...(tele.isObstacleDetected
      ? [{
          label: "Obstacle Detected",
          distance: `${tele.raw.distance}cm`,
          confidence: 95,
          tint: 'destructive' as const,
        }]
      : []),
    {
      label: "Path Ahead",
      distance: tele.isObstacleDetected ? "Blocked" : "Clear",
      confidence: isConnected ? 92 : 0,
      tint: tele.isObstacleDetected ? 'warning' : 'success',
    },
  ];

  return (
    <div>
      <ScreenHeader title="Obstacle Detection" subtitle="Live AI vision" />

      <div className="px-5">
        {/* Camera / detection viewport */}
        <div className="relative h-80 overflow-hidden rounded-3xl bg-foreground shadow-elevated">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#0b1d2a,#10303a)]" />
          {/* scanline */}
          <div className="absolute inset-x-0 top-1/3 h-px bg-primary/70 shadow-[0_0_18px_4px_oklch(0.78_0.12_195/0.6)]" />

          {/* detection boxes — animated based on obstacle state */}
          {tele.isObstacleDetected && (
            <div className="absolute left-8 top-16 h-32 w-20 rounded-xl border-2 border-destructive animate-pulse">
              <span className="absolute -top-6 left-0 rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                Object · {tele.distanceDisplay}
              </span>
            </div>
          )}

          {!tele.isObstacleDetected && isConnected && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-sm font-semibold text-success">✓ Path Clear</p>
              <p className="text-[10px] text-white/60">No obstacles detected</p>
            </div>
          )}

          {/* LIVE badge */}
          <div className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
            isConnected
              ? 'bg-destructive/90 text-destructive-foreground'
              : 'bg-muted/90 text-muted-foreground'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'animate-pulse bg-white' : 'bg-muted-foreground'}`} />
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </div>

          <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <Camera className="h-3.5 w-3.5" />
            AI Vision
          </div>

          {/* Voice alert */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 text-white backdrop-blur">
            <Volume2 className="h-4 w-4" />
            <span className="text-xs font-medium">
              {tele.isObstacleDetected
                ? `"Obstacle ahead at ${tele.distanceDisplay}, slowing down..."`
                : '"Path is clear, proceeding safely."'}
            </span>
          </div>
        </div>

        <h3 className="mt-5 text-sm font-bold text-muted-foreground">Detected objects</h3>
        <div className="mt-3 space-y-2">
          {detections.map((d) => (
            <div key={d.label} className="flex items-center justify-between rounded-2xl bg-surface-elevated p-4 shadow-soft">
              <div>
                <p className="text-sm font-semibold">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.distance} · {d.confidence}% confidence</p>
              </div>
              <span
                className={`inline-flex h-8 items-center rounded-full px-3 text-[11px] font-bold ${
                  d.tint === "success" ? "bg-success/15 text-success" :
                  d.tint === "warning" ? "bg-warning/25 text-warning-foreground" :
                  "bg-destructive/15 text-destructive"
                }`}
              >
                {d.tint === "destructive" ? "STOP" : d.tint === "warning" ? "CAUTION" : "OK"}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => emergencyStop()}
          className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-gradient-sos text-base font-bold text-destructive-foreground shadow-elevated active:scale-[0.98] transition-transform"
        >
          <Pause className="h-6 w-6" />
          Emergency Stop
        </button>
      </div>
    </div>
  );
}
