import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Battery, Bell, Navigation as NavIcon, Mic, AlertTriangle,
  Eye, Activity, MapPin, Sparkles, Zap, Wifi, WifiOff, Fingerprint
} from "lucide-react";
import { RobotAvatar } from "@/components/RobotAvatar";
import { useESP32 } from "@/hooks/useESP32";
import { useTelemetry } from "@/hooks/useTelemetry";
import { SIMULATION_MODE } from "@/services/websocketService";
import { useWheelchairStore } from "@/store/wheelchairStore";

export const Route = createFileRoute("/home")({
  component: Home,
});

const actions = [
  { to: "/navigation", icon: NavIcon, label: "Navigate", tint: "bg-secondary text-secondary-foreground" },
  { to: "/companion", icon: Sparkles, label: "Movi Face", tint: "bg-primary/20 text-primary-glow" },
  { to: "/voice", icon: Mic, label: "Voice Control", tint: "bg-accent/40 text-accent-foreground" },
  { to: "/sos", icon: AlertTriangle, label: "Emergency", tint: "bg-destructive/15 text-destructive" },
  { to: "/obstacles", icon: Eye, label: "Obstacles", tint: "bg-primary/15 text-primary" },
  { to: "/health", icon: Activity, label: "Health", tint: "bg-success/20 text-success" },
  { to: "/remote", icon: Zap, label: "Remote Control", tint: "bg-warning/25 text-warning-foreground" },
];

function Home() {
  const { isConnected } = useESP32();
  const tele = useTelemetry();
  const updateTelemetry = useWheelchairStore(s => s.updateTelemetry);

  const triggerObstacle = () => {
    updateTelemetry({ obstacle: true, distance: 15 });
  };
  
  const clearObstacle = () => {
    updateTelemetry({ obstacle: false, distance: 60 });
  };

  return (
    <div className="px-5 pb-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good morning,</p>
          <h1 className="text-2xl font-bold">Hi, Alex 👋</h1>
        </div>
        <Link
          to="/sos"
          aria-label="Notifications"
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated shadow-soft"
        >
          <Bell className="h-5 w-5" />
          {tele.isEmergency && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
        </Link>
      </div>

      {/* Status hero — connected to live telemetry */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium opacity-90">Wheelchair status</p>
            <p className="mt-1 text-lg font-bold">{tele.systemStatus}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              {isConnected ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 opacity-80" />
                  Disconnected
                </>
              )}
            </div>
          </div>
          <RobotAvatar size={56} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat icon={Battery} value={tele.batteryDisplay} label="Battery" />
          <Stat icon={Zap} value={tele.speedDisplay} label="Speed" />
          <Stat icon={Wifi} value={tele.modeDisplay} label="Mode" />
        </div>
      </div>

      {/* AI assistant widget */}
      <Link
        to="/voice"
        className="mt-4 flex items-center gap-3 rounded-3xl bg-surface-elevated p-4 shadow-card"
      >
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-health">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">AI Assistant ready</p>
          <p className="text-xs text-muted-foreground">
            {isConnected ? 'Say "Hey Movi" to start' : "Connect to ESP32 first"}
          </p>
        </div>
        <div className="flex items-end gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-5 w-1 origin-bottom animate-wave rounded-full bg-primary"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      </Link>

      {/* Live sensor strip */}
      {isConnected && (
        <div className="mt-4 flex items-center gap-3 overflow-x-auto rounded-2xl bg-surface-elevated p-3 shadow-soft">
          <SensorChip
            label="Distance"
            value={tele.distanceDisplay}
            status={tele.distanceStatus}
          />
          <SensorChip
            label="EMG"
            value={`${tele.emgValue}`}
            status={tele.emgLevel === 'high' ? 'danger' : 'safe'}
          />
          <SensorChip
            label="Signal"
            value={tele.signalDisplay}
            status={tele.signalStrengthLabel === 'poor' ? 'warning' : 'safe'}
          />
        </div>
      )}

      <h2 className="mt-7 text-lg font-bold">Quick Actions</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {actions.map(({ to, icon: Icon, label, tint }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col gap-3 rounded-3xl bg-surface-elevated p-4 shadow-soft transition-transform active:scale-[0.97]"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      {SIMULATION_MODE && (
        <div className="mt-6 rounded-3xl bg-warning/10 p-4 border border-warning/30">
          <div className="flex items-center gap-2 mb-3">
            <Fingerprint className="h-5 w-5 text-warning" />
            <h3 className="font-bold text-warning">Simulation Controls</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={triggerObstacle}
              className="flex-1 rounded-xl bg-warning px-3 py-2 text-xs font-bold text-warning-foreground transition-transform active:scale-95"
            >
              Trigger Obstacle
            </button>
            <button 
              onClick={clearObstacle}
              className="flex-1 rounded-xl bg-surface px-3 py-2 text-xs font-bold transition-transform active:scale-95"
            >
              Clear Obstacle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Battery; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 opacity-90" />
        <span className="text-xs opacity-90">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function SensorChip({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'safe' | 'warning' | 'danger';
}) {
  const dot =
    status === 'danger'
      ? 'bg-destructive'
      : status === 'warning'
        ? 'bg-warning'
        : 'bg-success';
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-bold">{value}</span>
    </div>
  );
}
