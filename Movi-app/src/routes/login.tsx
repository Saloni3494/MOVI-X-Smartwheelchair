import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone, Lock, Mic, Users, Accessibility } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [tab, setTab] = useState<"email" | "phone">("email");

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-8 pt-12">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Accessibility className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
      </div>

      <div className="mt-8 flex rounded-2xl bg-surface p-1.5">
        {(["email", "phone"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition-all ${
              tab === t
                ? "bg-surface-elevated text-foreground shadow-soft"
                : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <Field
          icon={tab === "email" ? Mail : Phone}
          label={tab === "email" ? "Email address" : "Phone number"}
          placeholder={tab === "email" ? "you@example.com" : "+1 (555) 000-0000"}
          type={tab === "email" ? "email" : "tel"}
        />
        <Field icon={Lock} label="Password" placeholder="••••••••" type="password" />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              className="h-5 w-5 rounded-md border-border accent-[var(--color-primary)]"
            />
            Remember me
          </label>
          <button className="font-semibold text-primary">Forgot?</button>
        </div>
      </div>

      <Link
        to="/home"
        className="mt-6 flex h-14 items-center justify-center rounded-2xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
      >
        Sign In
      </Link>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        OR
        <span className="h-px flex-1 bg-border" />
      </div>

      <button className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-border bg-surface-elevated text-sm font-semibold shadow-soft">
        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.3-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-1.9 1.3-4.3 2.1-7 2.1-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.4 39.1 16 43.5 24 43.5z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.4l6 5.1c-.4.4 6.7-4.9 6.7-14.5 0-1.3-.1-2.3-.4-3.5z" />
        </svg>
        Continue with Google
      </button>

      <Link
        to="/home"
        className="mt-3 flex h-14 items-center justify-center gap-3 rounded-2xl border border-border bg-secondary text-sm font-semibold text-secondary-foreground"
      >
        <Users className="h-5 w-5" />
        Continue as Caretaker
      </Link>

      <button
        aria-label="Voice assistance"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary shadow-glow"
      >
        <Mic className="h-6 w-6 text-primary-foreground" />
      </button>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  ...props
}: { icon: typeof Mail; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <input
          {...props}
          className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>
    </label>
  );
}
