import { useWheelchairStore } from '@/store/wheelchairStore';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import * as ws from '@/services/websocketService';

/**
 * Thin status bar shown at top of all screens.
 * Green = connected, amber = connecting, red = disconnected.
 */
export function ConnectionStatusBar() {
  const status = useWheelchairStore((s) => s.connectionStatus);
  const latency = useWheelchairStore((s) => s.heartbeatLatency);
  const attempts = useWheelchairStore((s) => s.reconnectAttempts);

  if (status === 'connected') {
    return (
      <div className="flex items-center justify-center gap-2 bg-success/15 px-3 py-1.5 text-[11px] font-semibold text-success">
        <Wifi className="h-3.5 w-3.5" />
        <span>Connected to ESP32</span>
        <span className="opacity-70">·</span>
        <span className="opacity-70">{latency}ms</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center justify-center gap-2 bg-warning/20 px-3 py-1.5 text-[11px] font-semibold text-warning-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Connecting{attempts > 0 ? ` (attempt ${attempts})` : ''}...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={() => { ws.disconnect(); setTimeout(() => ws.connect(), 200); }}
        className="flex w-full items-center justify-center gap-2 bg-destructive/15 px-3 py-1.5 text-[11px] font-semibold text-destructive"
      >
        <WifiOff className="h-3.5 w-3.5" />
        <span>Connection error · Tap to retry</span>
      </button>
    );
  }

  // disconnected
  return (
    <button
      onClick={() => ws.connect()}
      className="flex w-full items-center justify-center gap-2 bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground"
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>Disconnected · Tap to connect</span>
    </button>
  );
}
