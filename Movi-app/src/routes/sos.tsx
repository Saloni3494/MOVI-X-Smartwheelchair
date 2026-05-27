import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { Phone, MapPin, Users, AlertTriangle, ArrowLeft } from "lucide-react";
import { useESP32 } from "@/hooks/useESP32";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useWheelchairStore } from "@/store/wheelchairStore";

export const Route = createFileRoute("/sos")({
  component: SOS,
});

function SOS() {
  const [holding, setHolding] = useState(false);
  const [activated, setActivated] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { emergencyStop } = useESP32();
  const tele = useTelemetry();
  const logs = useWheelchairStore((s) => s.debugLogs);

  // Get critical/safety events for alert history
  const alertHistory = logs
    .filter((l) => l.level === 'CRITICAL' || l.level === 'ERROR')
    .slice(-5)
    .reverse();

  const handleHoldStart = useCallback(() => {
    setHolding(true);
    holdTimerRef.current = setTimeout(async () => {
      setActivated(true);
      await emergencyStop();
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    }, 1500); // Hold for 1.5s to activate
  }, [emergencyStop]);

  const handleHoldEnd = useCallback(() => {
    setHolding(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const handleCallCaretaker = () => {
    // Open phone dialer
    window.location.href = 'tel:+911234567890';
  };

  const handleShareLocation = () => {
    if (tele.hasGps) {
      const url = `https://maps.google.com/?q=${tele.raw.latitude},${tele.raw.longitude}`;
      if (navigator.share) {
        navigator.share({
          title: 'MOVI-X Emergency Location',
          text: `Emergency! My location: ${tele.gpsCoordinates}`,
          url,
        });
      } else {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-destructive/10 via-background to-background px-5 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-elevated shadow-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">Emergency</h1>
        <div className="w-11" />
      </div>

      {/* Emergency status banner */}
      {(activated || tele.isEmergency) && (
        <div className="mt-4 animate-pulse rounded-2xl bg-destructive/20 p-3 text-center text-sm font-bold text-destructive">
          ⚠️ EMERGENCY STOP ACTIVE — Motors halted
        </div>
      )}

      <div className="mt-10 flex flex-col items-center">
        <button
          onPointerDown={handleHoldStart}
          onPointerUp={handleHoldEnd}
          onPointerLeave={handleHoldEnd}
          className={`relative flex h-56 w-56 items-center justify-center rounded-full text-destructive-foreground shadow-elevated active:scale-[0.97] transition-transform ${
            holding ? 'bg-destructive scale-110' : 'bg-gradient-sos'
          }`}
        >
          <span className="absolute inset-0 rounded-full bg-destructive/60 animate-pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-destructive/40 animate-pulse-ring" style={{ animationDelay: "0.6s" }} />
          <div className="relative flex flex-col items-center">
            <AlertTriangle className="h-14 w-14" strokeWidth={2.4} />
            <span className="mt-2 text-3xl font-extrabold tracking-wider">SOS</span>
            <span className="text-xs font-semibold opacity-90">
              {holding ? 'Keep holding...' : 'Hold to activate'}
            </span>
          </div>
        </button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Tap and hold the SOS button to trigger emergency stop and alert contacts.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <ActionCard
          icon={Phone}
          label="Call Caretaker"
          tint="bg-success text-success-foreground"
          onClick={handleCallCaretaker}
        />
        <ActionCard
          icon={MapPin}
          label="Share Location"
          tint="bg-primary text-primary-foreground"
          onClick={handleShareLocation}
        />
      </div>

      <div className="mt-3 rounded-3xl bg-surface-elevated p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Emergency contacts</p>
            <p className="text-xs text-muted-foreground">3 people will be notified</p>
          </div>
          <span className="text-xs font-semibold text-primary">Manage</span>
        </div>
      </div>

      <h3 className="mt-6 text-sm font-bold text-muted-foreground">Alert history</h3>
      <div className="mt-3 space-y-2">
        {alertHistory.length > 0 ? (
          alertHistory.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-2xl bg-surface-elevated p-4 shadow-soft">
              <div>
                <p className="text-sm font-semibold">{a.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.timestamp).toLocaleTimeString()} · {a.category}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                a.level === 'CRITICAL'
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-warning/25 text-warning-foreground'
              }`}>
                {a.level}
              </span>
            </div>
          ))
        ) : (
          <>
            {[
              { t: "Fall detected", d: "Yesterday · resolved", c: "success" },
              { t: "Health alert", d: "Mar 12 · auto-dismissed", c: "warning" },
            ].map((a) => (
              <div key={a.t} className="flex items-center justify-between rounded-2xl bg-surface-elevated p-4 shadow-soft">
                <div>
                  <p className="text-sm font-semibold">{a.t}</p>
                  <p className="text-xs text-muted-foreground">{a.d}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  a.c === "success" ? "bg-success/15 text-success" : "bg-warning/25 text-warning-foreground"
                }`}>{a.c === "success" ? "RESOLVED" : "DISMISSED"}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, label, tint, onClick }: { icon: typeof Phone; label: string; tint: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-24 flex-col items-start justify-between rounded-3xl p-4 shadow-card active:scale-[0.97] transition-transform ${tint}`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
