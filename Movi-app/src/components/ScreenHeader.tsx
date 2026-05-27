import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  subtitle,
  back = "/home",
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string | false;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-background/90 px-5 pb-3 pt-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {back !== false && (
          <Link
            to={back as string}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-foreground shadow-soft transition-transform active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <div>
          <h1 className="text-xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}
