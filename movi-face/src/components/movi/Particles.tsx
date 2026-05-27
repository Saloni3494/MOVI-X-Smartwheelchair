import { useMemo } from "react";

export function Particles() {
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 6 + Math.random() * 6,
        size: 2 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute bottom-0 rounded-full bg-cyan-glow"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            boxShadow: "0 0 6px oklch(0.85 0.2 200)",
            animation: `particle-rise ${d.duration}s ease-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
