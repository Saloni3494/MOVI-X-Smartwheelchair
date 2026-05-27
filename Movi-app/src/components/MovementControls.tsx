import { useCallback, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CircleStop } from 'lucide-react';
import { useESP32 } from '@/hooks/useESP32';
import { useTelemetry } from '@/hooks/useTelemetry';
import type { MovementCommand } from '@/utils/commandParser';

/**
 * Floating D-pad movement control overlay.
 * Touch-and-hold for continuous movement, release to stop.
 */
export function MovementControls() {
  const { sendCommand } = useESP32();
  const { speedDisplay, movementDisplay } = useTelemetry();
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePressStart = useCallback(
    (direction: MovementCommand) => {
      sendCommand(direction);
      // Continuous send while held
      holdTimerRef.current = setInterval(() => {
        sendCommand(direction);
      }, 300);
    },
    [sendCommand],
  );

  const handlePressEnd = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    sendCommand('stop');
  }, [sendCommand]);

  const btnBase =
    'flex h-14 w-14 items-center justify-center rounded-2xl shadow-card active:scale-95 transition-transform select-none touch-none';
  const btnDir = `${btnBase} bg-gradient-primary text-primary-foreground`;
  const btnStop = `${btnBase} bg-gradient-sos text-destructive-foreground`;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Speed indicator */}
      <div className="mb-1 rounded-full bg-surface-elevated/95 px-4 py-1 text-[11px] font-semibold shadow-soft backdrop-blur">
        {movementDisplay} · {speedDisplay}
      </div>

      {/* D-pad grid */}
      <div className="grid grid-cols-3 grid-rows-3 gap-2">
        {/* Row 1: empty, forward, empty */}
        <div />
        <button
          className={btnDir}
          onPointerDown={() => handlePressStart('forward')}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          aria-label="Move forward"
        >
          <ArrowUp className="h-7 w-7" strokeWidth={2.5} />
        </button>
        <div />

        {/* Row 2: left, stop, right */}
        <button
          className={btnDir}
          onPointerDown={() => handlePressStart('left')}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          aria-label="Turn left"
        >
          <ArrowLeft className="h-7 w-7" strokeWidth={2.5} />
        </button>
        <button
          className={btnStop}
          onPointerDown={() => sendCommand('stop')}
          aria-label="Stop"
        >
          <CircleStop className="h-7 w-7" strokeWidth={2.5} />
        </button>
        <button
          className={btnDir}
          onPointerDown={() => handlePressStart('right')}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          aria-label="Turn right"
        >
          <ArrowRight className="h-7 w-7" strokeWidth={2.5} />
        </button>

        {/* Row 3: empty, backward, empty */}
        <div />
        <button
          className={btnDir}
          onPointerDown={() => handlePressStart('backward')}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          aria-label="Move backward"
        >
          <ArrowDown className="h-7 w-7" strokeWidth={2.5} />
        </button>
        <div />
      </div>
    </div>
  );
}
