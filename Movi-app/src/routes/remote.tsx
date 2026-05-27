import { createFileRoute } from "@tanstack/react-router";
import { Gamepad2, Settings2 } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { MovementControls } from "@/components/MovementControls";
import { useESP32 } from "@/hooks/useESP32";
import { useWheelchairStore } from "@/store/wheelchairStore";

export const Route = createFileRoute("/remote")({
  component: RemoteControl,
});

function RemoteControl() {
  const { isConnected, changeMode } = useESP32();
  const speedLimit = useWheelchairStore((s) => s.speedLimit);
  const setSpeedLimit = useWheelchairStore((s) => s.setSpeedLimit);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ScreenHeader title="Remote Control" subtitle="Manual joystick override" />

      <div className="flex-1 px-5 pt-4 pb-8 flex flex-col">
        {/* Status Card */}
        <div className="mb-6 flex items-center justify-between rounded-3xl bg-surface-elevated p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-soft ${isConnected ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold">Manual Mode</p>
              <p className="text-xs text-muted-foreground">
                {isConnected ? 'Hardware ready' : 'Hardware disconnected'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => changeMode('manual')}
            disabled={!isConnected}
            className="rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-transform active:scale-95 disabled:opacity-50"
          >
            Activate
          </button>
        </div>

        {/* Speed Slider */}
        <div className="mb-10 rounded-3xl bg-surface-elevated p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Settings2 className="h-4 w-4 text-primary" />
              Max Speed Limiter
            </div>
            <span className="text-xs font-bold text-primary">{speedLimit}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="10"
            value={speedLimit}
            onChange={(e) => setSpeedLimit(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* D-Pad Controls */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative flex h-80 w-full max-w-sm flex-col items-center justify-center rounded-[3rem] bg-surface-elevated shadow-elevated">
            <div className="absolute inset-4 rounded-[2.5rem] border border-border/50 bg-background/50" />
            
            <div className="relative z-10 scale-125">
              <MovementControls />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
