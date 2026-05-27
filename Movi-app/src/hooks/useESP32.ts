// =============================================================================
// MOVI-X useESP32 Hook — Primary hook for ESP32 hardware integration
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { useWheelchairStore } from '@/store/wheelchairStore';
import * as ws from '@/services/websocketService';
import * as hw from '@/services/hardwareService';
import { initDebugService } from '@/services/debugService';
import { logger } from '@/utils/logger';
import type { MovementCommand, ModeCommand } from '@/utils/commandParser';

const HEARTBEAT_INTERVAL = 1000; // 1 second

/**
 * Primary hook for ESP32 hardware connection.
 * - Auto-connects WebSocket on mount
 * - Runs heartbeat interval
 * - Exposes all hardware control functions
 * - Auto-disconnects on unmount
 */
let activeHookCount = 0;
let globalHeartbeatTimer: ReturnType<typeof setInterval> | null = null;

export function useESP32() {
  const connectionStatus = useWheelchairStore((s) => s.connectionStatus);
  const telemetry = useWheelchairStore((s) => s.telemetry);
  const latency = useWheelchairStore((s) => s.heartbeatLatency);
  const reconnectAttempts = useWheelchairStore((s) => s.reconnectAttempts);

  // Initialize services and connect on mount
  useEffect(() => {
    activeHookCount++;

    if (activeHookCount === 1) {
      initDebugService();
      logger.info('SYSTEM', 'MOVI-X hardware integration starting');

      // Connect WebSocket
      ws.connect();

      // Start heartbeat
      globalHeartbeatTimer = setInterval(async () => {
        if (ws.isConnected()) {
          try {
            await hw.sendHeartbeat();
          } catch {
            // Heartbeat failure is logged inside hardwareService
          }
        }
      }, HEARTBEAT_INTERVAL);
    }

    return () => {
      activeHookCount--;
      if (activeHookCount === 0) {
        if (globalHeartbeatTimer) {
          clearInterval(globalHeartbeatTimer);
          globalHeartbeatTimer = null;
        }
        ws.disconnect();
        logger.info('SYSTEM', 'MOVI-X hardware integration stopped');
      }
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────
  const sendCommand = useCallback(async (direction: MovementCommand) => {
    const result = await hw.sendMovement(direction);
    if (result.success) {
      logger.info('MOTOR', `Movement: ${direction.toUpperCase()}`);
    }
    return result;
  }, []);

  const changeMode = useCallback(async (mode: ModeCommand) => {
    const result = await hw.setMode(mode);
    if (result.success) {
      logger.info('SYSTEM', `Mode changed: ${mode.toUpperCase()}`);
    }
    return result;
  }, []);

  const triggerEmergencyStop = useCallback(async () => {
    return hw.emergencyStop();
  }, []);

  const changeSpeed = useCallback(async (percent: number) => {
    return hw.setSpeed(percent);
  }, []);

  const reconnect = useCallback(() => {
    ws.disconnect();
    setTimeout(() => ws.connect(), 200);
  }, []);

  const ping = useCallback(async () => {
    return hw.pingESP32();
  }, []);

  return {
    // State
    telemetry,
    connectionStatus,
    latency,
    reconnectAttempts,
    isConnected: connectionStatus === 'connected',

    // Actions
    sendCommand,
    changeMode,
    emergencyStop: triggerEmergencyStop,
    changeSpeed,
    reconnect,
    ping,
  };
}
