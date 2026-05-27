import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import {
  Terminal, Wifi, Activity, Gauge, Shield, Search,
  Download, Trash2, Send, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useWheelchairStore } from '@/store/wheelchairStore';
import { useESP32 } from '@/hooks/useESP32';
import { useTelemetry } from '@/hooks/useTelemetry';
import { logger, type LogLevel, type LogCategory } from '@/utils/logger';
import type { LogEntry } from '@/utils/logger';

export const Route = createFileRoute('/debug')({
  component: DebugConsole,
});

// ── Tab definitions ─────────────────────────────────────────────────────────
type FilterTab = 'all' | 'CONNECTION' | 'SENSOR' | 'MOTOR' | 'SAFETY';

const TABS: { key: FilterTab; label: string; icon: typeof Terminal }[] = [
  { key: 'all', label: 'All', icon: Terminal },
  { key: 'CONNECTION', label: 'Connection', icon: Wifi },
  { key: 'SENSOR', label: 'Sensors', icon: Activity },
  { key: 'MOTOR', label: 'Motors', icon: Gauge },
  { key: 'SAFETY', label: 'Safety', icon: Shield },
];

// ── Level colors ────────────────────────────────────────────────────────────
const levelColors: Record<LogLevel, string> = {
  INFO: 'text-primary bg-primary/10',
  WARNING: 'text-warning-foreground bg-warning/20',
  ERROR: 'text-destructive bg-destructive/10',
  CRITICAL: 'text-destructive bg-destructive/20 animate-pulse',
};

const levelDots: Record<LogLevel, string> = {
  INFO: 'bg-primary',
  WARNING: 'bg-warning',
  ERROR: 'bg-destructive',
  CRITICAL: 'bg-destructive animate-pulse',
};

// ── Main Component ──────────────────────────────────────────────────────────
function DebugConsole() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rawCmd, setRawCmd] = useState('');
  const [showTelemetry, setShowTelemetry] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const logs = useWheelchairStore((s) => s.debugLogs);
  const { connectionStatus, latency, reconnectAttempts, ping } = useESP32();
  const tele = useTelemetry();

  // Auto-scroll to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    if (activeTab !== 'all' && l.category !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: logs.length,
    info: logs.filter((l) => l.level === 'INFO').length,
    warning: logs.filter((l) => l.level === 'WARNING').length,
    error: logs.filter((l) => l.level === 'ERROR').length,
    critical: logs.filter((l) => l.level === 'CRITICAL').length,
  };

  const handleSendRaw = async () => {
    if (!rawCmd.trim()) return;
    logger.info('SYSTEM', `Manual command: ${rawCmd}`);
    // Try to call as API endpoint
    try {
      const ip = useWheelchairStore.getState().esp32Ip;
      const res = await fetch(`http://${ip}${rawCmd.startsWith('/') ? rawCmd : '/' + rawCmd}`, {
        method: 'POST',
      });
      const data = await res.json();
      logger.info('API', `Response: ${JSON.stringify(data)}`);
    } catch (err) {
      logger.error('API', `Failed: ${err}`);
    }
    setRawCmd('');
  };

  return (
    <div>
      <ScreenHeader title="Debug Console" subtitle="Hardware diagnostics" />

      <div className="space-y-4 px-5 pb-8">
        {/* Connection card */}
        <div className="rounded-3xl bg-surface-elevated p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-success animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-warning animate-pulse' : 'bg-destructive'
              }`} />
              <span className="text-sm font-semibold capitalize">{connectionStatus}</span>
            </div>
            <button
              onClick={() => ping()}
              className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary"
            >
              PING
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <MiniStat label="Latency" value={`${latency}ms`} />
            <MiniStat label="Uptime" value={tele.uptimeFormatted} />
            <MiniStat label="Reconnects" value={`${reconnectAttempts}`} />
          </div>
        </div>

        {/* Log stats bar */}
        <div className="flex items-center gap-2 rounded-2xl bg-surface-elevated p-3 shadow-soft">
          <StatBadge label="Total" count={stats.total} color="bg-muted text-muted-foreground" />
          <StatBadge label="Info" count={stats.info} color="bg-primary/10 text-primary" />
          <StatBadge label="Warn" count={stats.warning} color="bg-warning/20 text-warning-foreground" />
          <StatBadge label="Error" count={stats.error} color="bg-destructive/10 text-destructive" />
          <StatBadge label="Critical" count={stats.critical} color="bg-destructive/20 text-destructive" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-surface p-1.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all ${
                activeTab === key
                  ? 'bg-surface-elevated text-foreground shadow-soft'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Search + actions */}
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-surface-elevated px-3 py-2 shadow-soft">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={() => logger.exportLogs()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-elevated shadow-soft"
            aria-label="Export logs"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => useWheelchairStore.getState().clearDebugLogs()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-elevated shadow-soft"
            aria-label="Clear logs"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Log entries */}
        <div className="max-h-80 space-y-1 overflow-y-auto rounded-3xl bg-foreground/[0.03] p-3">
          {filteredLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No logs yet</p>
          ) : (
            filteredLogs.map((log) => <LogRow key={log.id} log={log} />)
          )}
          <div ref={logEndRef} />
        </div>

        {/* Raw command input */}
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-surface-elevated px-3 py-2 shadow-soft">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="/api/v1/movement/forward"
              value={rawCmd}
              onChange={(e) => setRawCmd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendRaw()}
              className="flex-1 bg-transparent font-mono text-xs focus:outline-none"
            />
          </div>
          <button
            onClick={handleSendRaw}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"
            aria-label="Send command"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Collapsible telemetry panel */}
        <button
          onClick={() => setShowTelemetry(!showTelemetry)}
          className="flex w-full items-center justify-between rounded-2xl bg-surface-elevated p-3 shadow-soft"
        >
          <span className="text-sm font-semibold">Raw Telemetry Data</span>
          {showTelemetry ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showTelemetry && (
          <div className="rounded-3xl bg-foreground/[0.03] p-4">
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
              {JSON.stringify(tele.raw, null, 2)}
            </pre>
          </div>
        )}

        {/* Sensor debug panels */}
        <div className="grid grid-cols-2 gap-3">
          <SensorCard
            title="Ultrasonic"
            items={[
              { label: 'Distance', value: tele.distanceDisplay },
              { label: 'Status', value: tele.distanceStatus },
              { label: 'Obstacle', value: tele.isObstacleDetected ? 'YES' : 'No' },
            ]}
          />
          <SensorCard
            title="EMG"
            items={[
              { label: 'Raw', value: `${tele.emgValue}` },
              { label: 'Level', value: tele.emgLevel },
            ]}
          />
          <SensorCard
            title="GPS"
            items={[
              { label: 'Coords', value: tele.hasGps ? 'Lock' : 'No lock' },
              { label: 'Lat', value: `${tele.raw.latitude.toFixed(4)}` },
              { label: 'Lng', value: `${tele.raw.longitude.toFixed(4)}` },
            ]}
          />
          <SensorCard
            title="Motor"
            items={[
              { label: 'Direction', value: tele.movementDisplay },
              { label: 'Speed', value: tele.speedDisplay },
              { label: 'Mode', value: tele.modeDisplay },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LogRow({ log }: { log: LogEntry }) {
  const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex items-start gap-2 rounded-xl px-2 py-1.5 text-[11px] hover:bg-surface-elevated/50">
      <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${levelDots[log.level]}`} />
      <span className="shrink-0 font-mono text-muted-foreground">{time}</span>
      <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono font-bold ${levelColors[log.level]}`}>
        {log.level}
      </span>
      <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono font-semibold text-secondary-foreground">
        {log.category}
      </span>
      <span className="break-all font-mono text-foreground/80">{log.message}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function StatBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${color}`}>
      {count} {label}
    </div>
  );
}

function SensorCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-2xl bg-surface-elevated p-3 shadow-soft">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
            <span className="font-mono text-xs font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
