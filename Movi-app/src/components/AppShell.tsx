import { Outlet, useLocation, Link } from "@tanstack/react-router";
import { Home, Navigation, Heart, Settings, Mic, Terminal } from "lucide-react";
import { useWheelchairStore } from "@/store/wheelchairStore";
import { useTwilioAlerts } from "@/hooks/useTwilioAlerts";

const tabs = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/navigation", icon: Navigation, label: "Navigate" },
  { to: "/voice", icon: Mic, label: "Voice", center: true },
  { to: "/health", icon: Heart, label: "Health" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppShell() {
  const location = useLocation();
  const showDebugTab = useWheelchairStore((s) => s.showDebugTab);
  
  // Initialize global background workers
  useTwilioAlerts();
  
  const hideNav = ["/", "/onboarding", "/login", "/sos"].some((p) =>
    p === "/" ? location.pathname === "/" : location.pathname.startsWith(p),
  );

  // Inject debug tab if enabled
  const currentTabs = [...tabs];
  if (showDebugTab) {
    currentTabs[currentTabs.length - 1] = { to: "/debug", icon: Terminal, label: "Debug" };
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md bg-background">
      <main className={hideNav ? "min-h-dvh" : "min-h-dvh pb-24"}>
        <Outlet />
      </main>
      {!hideNav && <BottomNav pathname={location.pathname} currentTabs={currentTabs} />}
    </div>
  );
}

function BottomNav({ pathname, currentTabs }: { pathname: string, currentTabs: typeof tabs }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 pb-4"
    >
      <div className="relative flex items-center justify-around rounded-3xl border border-border bg-surface-elevated/95 px-2 py-2 shadow-elevated backdrop-blur-xl">
        {currentTabs.map(({ to, icon: Icon, label, center }) => {
          const active = pathname.startsWith(to);
          if (center) {
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="-mt-8 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform active:scale-95"
              >
                <Icon className="h-7 w-7" strokeWidth={2.2} />
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={`flex h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-2xl px-3 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.2} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
