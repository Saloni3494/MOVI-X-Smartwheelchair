import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Compass, ShieldCheck, HeartPulse, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const slides = [
  {
    icon: Compass,
    title: "Smart Navigation Assistance",
    desc: "Wheelchair-safe routes with real-time voice guidance and accessibility scoring.",
    tint: "from-primary-glow/40 to-primary/20",
  },
  {
    icon: ShieldCheck,
    title: "AI Safety & Obstacle Detection",
    desc: "On-device AI detects stairs, curbs and obstacles to keep you safe on every path.",
    tint: "from-accent/50 to-primary-glow/30",
  },
  {
    icon: HeartPulse,
    title: "Emergency & Health Monitoring",
    desc: "One-tap SOS, live tracking and continuous health vitals for peace of mind.",
    tint: "from-success/30 to-accent/40",
  },
];

function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const slide = slides[step];
  const Icon = slide.icon;
  const last = step === slides.length - 1;

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-8 pt-6">
      <div className="flex justify-end">
        <Link
          to="/login"
          className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground"
        >
          Skip
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          className={`relative mb-10 flex h-64 w-64 items-center justify-center rounded-[3rem] bg-gradient-to-br ${slide.tint} shadow-card`}
        >
          <div className="absolute inset-6 rounded-[2.5rem] bg-surface-elevated/70 backdrop-blur-sm" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow">
            <Icon className="h-12 w-12 text-primary-foreground" strokeWidth={2} />
          </div>
        </div>

        <h2 className="animate-fade-up text-center text-2xl font-bold leading-tight">
          {slide.title}
        </h2>
        <p className="mt-3 max-w-xs animate-fade-up text-center text-[15px] leading-relaxed text-muted-foreground">
          {slide.desc}
        </p>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-8 bg-primary" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => (last ? navigate({ to: "/login" }) : setStep(step + 1))}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
      >
        {last ? "Get Started" : "Next"}
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
