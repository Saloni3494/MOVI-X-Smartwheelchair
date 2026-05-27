import { useEffect, useRef, useState } from "react";

interface Detection {
  id: string;
  label: string;
  x: number; // %
  y: number;
  w: number;
  h: number;
  danger?: boolean;
  distance: string;
}

const MOCK_DETECTIONS: Detection[][] = [
  [
    { id: "p1", label: "Person", x: 18, y: 30, w: 22, h: 50, distance: "2.4 m" },
    { id: "d1", label: "Doorway", x: 55, y: 22, w: 28, h: 55, distance: "3.8 m" },
  ],
  [
    { id: "o1", label: "Obstacle", x: 40, y: 55, w: 24, h: 28, danger: true, distance: "1.1 m" },
    { id: "w1", label: "Wall", x: 70, y: 20, w: 25, h: 60, distance: "2.7 m" },
  ],
  [
    { id: "s1", label: "Stairs Ahead", x: 30, y: 40, w: 45, h: 45, danger: true, distance: "1.8 m" },
  ],
  [
    { id: "p2", label: "Person", x: 12, y: 25, w: 20, h: 55, distance: "3.2 m" },
    { id: "p3", label: "Caregiver", x: 65, y: 28, w: 22, h: 55, distance: "2.1 m" },
  ],
];

export function CameraFeed() {
  const [frame, setFrame] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % MOCK_DETECTIONS.length), 3500);
    return () => clearInterval(id);
  }, []);

  // attempt to use real camera if available
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setHasCamera(true);
        }
      })
      .catch(() => setHasCamera(false));
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const detections = MOCK_DETECTIONS[frame];
  const hasDanger = detections.some((d) => d.danger);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden glass shadow-glow-soft">
      {/* video or fallback */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        style={{ display: hasCamera ? "block" : "none" }}
      />
      {!hasCamera && (
        <div
          className="absolute inset-0 bg-grid"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.2 0.05 240) 0%, oklch(0.15 0.04 250) 50%, oklch(0.18 0.06 230) 100%)",
          }}
        >
          {/* simulated environment */}
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2"
            style={{
              background: "linear-gradient(to top, oklch(0.1 0.02 240), transparent)",
            }}
          />
        </div>
      )}

      {/* gradient vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/40 via-transparent to-background/60" />

      {/* HUD top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs font-display tracking-widest text-cyan-glow">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
          <span className="w-2 h-2 rounded-full bg-cyan-glow animate-pulse shadow-glow-cyan" />
          LIVE FRONT CAM
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full glass">
          <span>AI VISION</span>
          <span className="text-foreground/60">·</span>
          <span>{detections.length} OBJ</span>
        </div>
      </div>

      {/* navigation path */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="pathGrad" x1="0" y1="100%" x2="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.85 0.2 200)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="oklch(0.85 0.2 200)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 45 95 Q 50 70 50 50 T 52 10"
          fill="none"
          stroke="url(#pathGrad)"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
          style={{ filter: "drop-shadow(0 0 4px oklch(0.85 0.2 200))" }}
        />
        <path
          d="M 38 95 L 42 95 L 50 50 L 58 95 L 62 95 Z"
          fill="oklch(0.85 0.2 200 / 0.08)"
          stroke="oklch(0.85 0.2 200 / 0.4)"
          strokeWidth="0.3"
        />
      </svg>

      {/* detections */}
      {detections.map((d) => (
        <div
          key={d.id}
          className="absolute transition-all duration-700 ease-out"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: `${d.w}%`,
            height: `${d.h}%`,
          }}
        >
          <div
            className={`absolute inset-0 rounded-xl border-[1.5px] ${d.danger ? "animate-danger-pulse" : ""}`}
            style={{
              borderColor: d.danger ? "oklch(0.68 0.26 22)" : "oklch(0.85 0.2 200)",
              boxShadow: d.danger
                ? "0 0 16px oklch(0.68 0.26 22 / 0.6), inset 0 0 12px oklch(0.68 0.26 22 / 0.2)"
                : "0 0 12px oklch(0.85 0.2 200 / 0.4), inset 0 0 8px oklch(0.85 0.2 200 / 0.1)",
            }}
          >
            {/* corners */}
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <span
                key={c}
                className="absolute w-3 h-3 border-2"
                style={{
                  borderColor: d.danger ? "oklch(0.68 0.26 22)" : "oklch(0.85 0.2 200)",
                  top: c.startsWith("t") ? -1 : "auto",
                  bottom: c.startsWith("b") ? -1 : "auto",
                  left: c.endsWith("l") ? -1 : "auto",
                  right: c.endsWith("r") ? -1 : "auto",
                  borderTopWidth: c.startsWith("t") ? 2 : 0,
                  borderBottomWidth: c.startsWith("b") ? 2 : 0,
                  borderLeftWidth: c.endsWith("l") ? 2 : 0,
                  borderRightWidth: c.endsWith("r") ? 2 : 0,
                }}
              />
            ))}
          </div>
          <div
            className="absolute -top-7 left-0 px-2 py-0.5 rounded-md text-[10px] font-display tracking-wider whitespace-nowrap"
            style={{
              background: d.danger ? "oklch(0.68 0.26 22 / 0.9)" : "oklch(0.18 0.04 240 / 0.9)",
              color: d.danger ? "white" : "oklch(0.85 0.2 200)",
              border: `1px solid ${d.danger ? "oklch(0.68 0.26 22)" : "oklch(0.85 0.2 200 / 0.5)"}`,
            }}
          >
            {d.label.toUpperCase()} · {d.distance}
          </div>
        </div>
      ))}

      {/* AI floating text */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end gap-3">
        <div className="px-3 py-2 rounded-xl glass text-xs font-display tracking-widest text-cyan-glow max-w-[60%]">
          {hasDanger ? "⚠ OBSTACLE DETECTED" : "✓ SAFE PATH AVAILABLE"}
        </div>
        <div className="px-3 py-2 rounded-xl glass text-xs font-display tracking-widest text-cyan-glow">
          DIST · {detections[0]?.distance ?? "—"}
        </div>
      </div>
    </div>
  );
}
