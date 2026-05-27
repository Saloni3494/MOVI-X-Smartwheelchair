import { createFileRoute } from "@tanstack/react-router";
import { Battery, Gauge, ShieldCheck, MapPin, Bell } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useESP32 } from "@/hooks/useESP32";
import { useWheelchairStore } from "@/store/wheelchairStore";

export const Route = createFileRoute("/tracking")({
  component: Tracking,
});

function Tracking() {
  const tele = useTelemetry();
  const { isConnected } = useESP32();
  const logs = useWheelchairStore((s) => s.debugLogs);

  const safetyEvents = logs
    .filter((l) => l.level === 'WARNING' || l.level === 'CRITICAL')
    .slice(-5)
    .reverse();

  const statusLabel = tele.isEmergency ? 'Emergency' : tele.isObstacleDetected ? 'Caution' : isConnected ? 'Safe' : 'Offline';

  return (
    <div>
      <ScreenHeader title="Live Tracking" subtitle="Caretaker view" />
      <div className="px-5">
        <div className="relative h-80 overflow-hidden rounded-3xl shadow-card">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,oklch(0.93_0.04_200),oklch(0.96_0.03_160))]" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 300" preserveAspectRatio="none">
            <defs>
              <pattern id="grid2" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M30 0H0V30" fill="none" stroke="oklch(0.85 0.03 200)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="300" height="300" fill="url(#grid2)" />
            <path d="M30 240 Q120 200 160 160 T270 80" fill="none" stroke="oklch(0.72 0.14 155)" strokeWidth="4" strokeDasharray="6 6" strokeLinecap="round" />
          </svg>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
              {isConnected && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/50" />}
              <MapPin className="relative h-6 w-6" />
            </div>
          </div>
          {tele.hasGps && (
            <div className="absolute bottom-14 left-3 rounded-xl bg-surface-elevated/95 px-3 py-1.5 text-[10px] font-mono font-semibold shadow-soft backdrop-blur">
              📍 {tele.gpsCoordinates}
            </div>
          )}
          <div className="absolute left-3 right-3 top-3 flex items-center gap-3 rounded-2xl bg-surface-elevated/95 px-4 py-3 shadow-card backdrop-blur">
            <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'animate-pulse bg-success' : 'bg-muted-foreground'}`} />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Currently tracking</p>
              <p className="text-sm font-bold">Alex M. · {tele.modeDisplay} mode</p>
            </div>
            <span className={`text-xs font-semibold ${isConnected ? 'text-success' : 'text-muted-foreground'}`}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat icon={Battery} value={tele.batteryDisplay} label="Battery" />
          <MiniStat icon={Gauge} value={tele.speedDisplay} label="Speed" />
          <MiniStat icon={ShieldCheck} value={statusLabel} label="Status" />
        </div>

        <h3 className="mt-6 text-sm font-bold text-muted-foreground">Safety notifications</h3>
        <div className="mt-3 space-y-2">
          {safetyEvents.length > 0 ? safetyEvents.map((n) => (
            <div key={n.id} className="flex items-center gap-3 rounded-2xl bg-surface-elevated p-4 shadow-soft">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                n.level === 'CRITICAL' ? 'bg-destructive/15 text-destructive' : 'bg-warning/25 text-warning-foreground'
              }`}><Bell className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{n.message}</p>
                <p className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          )) : (
            [
              { t: "Entered safe zone", d: "Home · 8 min ago", c: "success" },
              { t: "Obstacle avoided", d: "Maple St · 22 min ago", c: "warning" },
              { t: "Trip started", d: "Greenpark · 1h ago", c: "primary" },
            ].map((n) => (
              <div key={n.t} className="flex items-center gap-3 rounded-2xl bg-surface-elevated p-4 shadow-soft">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  n.c === "success" ? "bg-success/15 text-success" : n.c === "warning" ? "bg-warning/25 text-warning-foreground" : "bg-primary/15 text-primary"
                }`}><Bell className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{n.t}</p>
                  <p className="text-xs text-muted-foreground">{n.d}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: typeof Battery; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface-elevated p-3 shadow-soft">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-1.5 text-sm font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
