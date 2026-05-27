import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility, Moon, Volume2, Phone, Languages,
  Users, Bell, ChevronRight, LogOut, Terminal, Wifi, Shield,
  Gauge
} from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useWheelchairStore } from "@/store/wheelchairStore";
import { useESP32 } from "@/hooks/useESP32";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const store = useWheelchairStore();
  const { isConnected, reconnect } = useESP32();

  return (
    <div>
      <ScreenHeader title="Settings" subtitle="Personalize your experience" back={false} />

      <div className="px-5 pb-8">
        <div className="flex items-center gap-3 rounded-3xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold backdrop-blur">
            A
          </div>
          <div className="flex-1">
            <p className="text-base font-bold">Alex Morgan</p>
            <p className="text-xs opacity-90">alex@movemate.app</p>
          </div>
          <ChevronRight className="h-5 w-5 opacity-80" />
        </div>

        <Section title="Hardware">
          <div className="flex flex-col gap-3 rounded-2xl bg-surface-elevated p-3.5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Wifi className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">ESP32 Connection</p>
                <p className="text-xs text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</p>
              </div>
              <button onClick={reconnect} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                Reconnect
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-xl bg-background px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground">IP:</span>
              <input 
                type="text" 
                value={store.esp32Ip}
                onChange={(e) => store.setEsp32Ip(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <RowBase icon={Gauge} label="Max Speed Limit" desc={`${store.speedLimit}%`}>
             <input
              type="range"
              min="20"
              max="100"
              value={store.speedLimit}
              onChange={(e) => store.setSpeedLimit(Number(e.target.value))}
              className="w-24 accent-primary"
            />
          </RowBase>

          <RowBase icon={Shield} label="Obstacle Threshold" desc={`${store.obstacleThreshold}cm`}>
            <input
              type="range"
              min="10"
              max="100"
              value={store.obstacleThreshold}
              onChange={(e) => store.setObstacleThreshold(Number(e.target.value))}
              className="w-24 accent-primary"
            />
          </RowBase>

          <ToggleRow 
            icon={Terminal} 
            label="Debug Console" 
            desc="Show debug tab in navigation" 
            value={store.showDebugTab} 
            onChange={(v) => store.setShowDebugTab(v)} 
          />
        </Section>

        <Section title="Accessibility">
          <ToggleRow icon={Accessibility} label="Accessibility mode" desc="Larger text & high contrast" value={true} onChange={() => {}} />
          <ToggleRow icon={Moon} label="Dark mode" desc="Easier on the eyes" value={false} onChange={() => {}} />
          <LinkRow icon={Volume2} label="Voice sensitivity" desc="Medium" />
        </Section>

        <Section title="Safety & Contacts">
          <LinkRow icon={Phone} label="Emergency contacts" desc="3 contacts" />
          <LinkRow icon={Users} label="Caretaker management" desc="2 caretakers" />
          <ToggleRow icon={Bell} label="Notifications" desc="Alerts & reminders" value={true} onChange={() => {}} />
        </Section>

        <Section title="Preferences">
          <LinkRow icon={Languages} label="Language" desc="English (US)" />
        </Section>

        <button className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive">
          <LogOut className="h-5 w-5" />
          Sign out
        </button>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          MOVI-X Firmware v{isConnected ? '1.0.0' : '---'}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RowBase({ icon: Icon, label, desc, children }: {
  icon: typeof Bell; label: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-elevated p-3.5 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function LinkRow(p: { icon: typeof Bell; label: string; desc: string }) {
  return (
    <RowBase {...p}>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </RowBase>
  );
}

function ToggleRow({
  value, onChange, ...p
}: { icon: typeof Bell; label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <RowBase {...p}>
      <button
        role="switch"
        aria-checked={value}
        aria-label={p.label}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          value ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-soft transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </RowBase>
  );
}
