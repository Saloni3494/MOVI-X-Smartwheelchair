import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Accessibility } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/onboarding" }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-hero px-6">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary-glow/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-accent/50 blur-3xl" />

      <div className="relative animate-float">
        <div className="absolute inset-0 -m-6 rounded-full bg-primary/30 blur-2xl" />
        <div className="relative flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-gradient-primary shadow-glow">
          <Accessibility className="h-16 w-16 text-primary-foreground" strokeWidth={2} />
        </div>
      </div>

      <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-foreground">
        Movi-X
      </h1>
      <p className="mt-3 max-w-xs text-center text-sm text-muted-foreground">
        Smart Mobility for Safer Independence
      </p>

      <div className="absolute bottom-16 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-pulse rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
