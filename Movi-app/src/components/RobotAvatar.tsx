import { Bot } from "lucide-react";

export function RobotAvatar({ size = 56 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center rounded-3xl bg-gradient-primary shadow-glow"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-primary opacity-60 blur-md" />
      <Bot className="relative h-1/2 w-1/2 text-primary-foreground" strokeWidth={2.2} />
    </div>
  );
}
