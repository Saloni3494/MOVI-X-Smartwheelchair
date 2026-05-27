import { createFileRoute } from "@tanstack/react-router";
import { Heart, Activity, Wind, Brain, Bell, Cpu } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useESP32 } from "@/hooks/useESP32";

export const Route = createFileRoute("/health")({
  component: Health,
});

function Health() {
  const tele = useTelemetry();
  const { isConnected } = useESP32();

  // EMG-based stress/fatigue mapping
  const emgStress = tele.emgValue < 1000 ? 'Low' : tele.emgValue < 2000 ? 'Medium' : 'High';
  const emgStressPct = Math.min(100, Math.round((tele.emgValue / 4095) * 100));
  const emgFatigue = tele.emgValue < 1500 ? 'Mild' : tele.emgValue < 3000 ? 'Moderate' : 'High';
  const emgFatiguePct = Math.min(100, Math.round((tele.emgValue / 4095) * 80));

  // Overall wellness score based on connection + battery + obstacle
  const wellnessScore = isConnected
    ? Math.round(
        (tele.batteryLevel * 0.4) +
        (tele.isObstacleDetected ? 20 : 40) +
        (tele.emgValue < 2000 ? 20 : 5)
      )
    : 92;

  const wellnessLabel = wellnessScore >= 80 ? 'Excellent' : wellnessScore >= 60 ? 'Good' : wellnessScore >= 40 ? 'Fair' : 'Needs attention';

  return (
    <div>
      <ScreenHeader title="Health Monitoring" subtitle="Real-time vitals" />

      <div className="px-5">
        <div className="rounded-3xl bg-gradient-health p-5 text-primary-foreground shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Overall wellness</p>
              <p className="mt-1 text-3xl font-bold">{wellnessLabel}</p>
              <p className="mt-1 text-xs opacity-90">
                {isConnected ? 'Updated just now' : 'Waiting for connection'}
              </p>
            </div>
            <Ring value={wellnessScore} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Metric
            icon={Cpu}
            label="EMG Signal"
            value={isConnected ? `${tele.emgValue}` : '—'}
            unit=""
            pct={isConnected ? emgStressPct : 0}
            tint="primary"
          />
          <Metric
            icon={Wind}
            label="Battery"
            value={isConnected ? `${tele.batteryLevel}` : '—'}
            unit="%"
            pct={tele.batteryLevel}
            tint={tele.batteryStatus === 'critical' ? 'destructive' : tele.batteryStatus === 'low' ? 'warning' : 'success'}
          />
          <Metric
            icon={Brain}
            label="Stress"
            value={isConnected ? emgStress : '—'}
            unit=""
            pct={emgStressPct}
            tint={emgStressPct > 60 ? 'destructive' : emgStressPct > 30 ? 'warning' : 'success'}
          />
          <Metric
            icon={Activity}
            label="Fatigue"
            value={isConnected ? emgFatigue : '—'}
            unit=""
            pct={emgFatiguePct}
            tint={emgFatiguePct > 60 ? 'destructive' : emgFatiguePct > 30 ? 'warning' : 'success'}
          />
        </div>

        {/* System health card */}
        <div className="mt-5 rounded-3xl bg-surface-elevated p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
              isConnected ? 'bg-success/20 text-success' : 'bg-warning/30 text-warning-foreground'
            }`}>
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">
                {isConnected ? 'System healthy' : 'Connection needed'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isConnected
                  ? `Uptime: ${tele.uptimeFormatted} · Signal: ${tele.signalStrengthLabel}`
                  : 'Connect to ESP32 to see real-time health data'}
              </p>
            </div>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-bold text-muted-foreground">System diagnostics</h3>
        <div className="mt-3 space-y-2">
          {[
            {
              t: "Motor System",
              d: isConnected ? `${tele.movementDisplay} · Speed: ${tele.speedDisplay}` : 'Offline',
              c: isConnected ? 'success' : 'destructive',
            },
            {
              t: "Obstacle Sensors",
              d: isConnected ? `Distance: ${tele.distanceDisplay} · ${tele.distanceStatus}` : 'Offline',
              c: isConnected ? (tele.isObstacleDetected ? 'destructive' : 'success') : 'destructive',
            },
            {
              t: "GPS Module",
              d: isConnected ? (tele.hasGps ? `Lock · ${tele.gpsCoordinates}` : 'No lock') : 'Offline',
              c: isConnected && tele.hasGps ? 'success' : 'warning',
            },
          ].map((a) => (
            <div key={a.t} className="flex items-center justify-between rounded-2xl bg-surface-elevated p-4 shadow-soft">
              <div>
                <p className="text-sm font-semibold">{a.t}</p>
                <p className="text-xs text-muted-foreground">{a.d}</p>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${a.c === "destructive" ? "bg-destructive" : a.c === "warning" ? "bg-warning" : "bg-success"}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="rgba(255,255,255,0.25)" strokeWidth="7" fill="none" />
        <circle
          cx="40" cy="40" r={r}
          stroke="white" strokeWidth="7" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{value}</span>
    </div>
  );
}

function Metric({
  icon: Icon, label, value, unit, pct, tint,
}: {
  icon: typeof Heart; label: string; value: string; unit: string; pct: number;
  tint: "destructive" | "primary" | "success" | "warning";
}) {
  const tints: Record<string, string> = {
    destructive: "text-destructive bg-destructive/15",
    primary: "text-primary bg-primary/15",
    success: "text-success bg-success/15",
    warning: "text-warning-foreground bg-warning/25",
  };
  const stroke: Record<string, string> = {
    destructive: "oklch(0.62 0.22 25)",
    primary: "oklch(0.68 0.12 195)",
    success: "oklch(0.72 0.14 155)",
    warning: "oklch(0.78 0.14 75)",
  };
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="rounded-3xl bg-surface-elevated p-4 shadow-soft">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${tints[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight">
            {value}<span className="ml-0.5 text-sm font-medium text-muted-foreground">{unit}</span>
          </p>
        </div>
        <svg viewBox="0 0 64 64" className="h-12 w-12 -rotate-90">
          <circle cx="32" cy="32" r={r} stroke="oklch(0.92 0.012 220)" strokeWidth="5" fill="none" />
          <circle
            cx="32" cy="32" r={r}
            stroke={stroke[tint]} strokeWidth="5" fill="none"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          />
        </svg>
      </div>
    </div>
  );
}
