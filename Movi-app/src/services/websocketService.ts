// =============================================================================
// MOVI-X WebSocket Service — Real-time telemetry from ESP32
// =============================================================================

import { logger } from '@/utils/logger';
import { useWheelchairStore } from '@/store/wheelchairStore';
import type { Telemetry } from '@/store/wheelchairStore';

type TelemetryCallback = (data: Telemetry) => void;

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 2;

// Toggle this to run the app without physical hardware
export const SIMULATION_MODE = true;

let ws: WebSocket | null = null;
let reconnectDelay = INITIAL_RECONNECT_DELAY;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let shouldReconnect = false;
let simulationTimer: ReturnType<typeof setInterval> | null = null;
const listeners: Set<TelemetryCallback> = new Set();

// ── Private helpers ─────────────────────────────────────────────────────────

function getWsUrl(): string {
  const ip = useWheelchairStore.getState().esp32Ip;
  return `ws://${ip}/ws`;
}

function handleOpen() {
  const store = useWheelchairStore.getState();
  store.setConnectionStatus('connected');
  store.resetReconnectAttempts();
  reconnectDelay = INITIAL_RECONNECT_DELAY;
  logger.info('CONNECTION', 'WebSocket connected to ESP32');
}

function handleMessage(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data) as Telemetry;
    const store = useWheelchairStore.getState();
    store.updateTelemetry(data);

    // Check for safety events
    if (data.obstacle && data.emergency) {
      logger.critical('SAFETY', `Emergency: obstacle at ${data.distance}cm`, data);
    } else if (data.obstacle) {
      logger.warn('SENSOR', `Obstacle detected at ${data.distance}cm`);
    }

    // Notify external listeners
    listeners.forEach((fn) => {
      try { fn(data); } catch { /* ignore */ }
    });
  } catch {
    logger.warn('CONNECTION', 'Failed to parse WebSocket message', event.data);
  }
}

function handleClose(event: CloseEvent) {
  ws = null;
  const store = useWheelchairStore.getState();
  store.setConnectionStatus('disconnected');
  logger.warn('CONNECTION', `WebSocket closed: code=${event.code} reason=${event.reason || 'none'}`);

  if (shouldReconnect) {
    scheduleReconnect();
  }
}

function handleError() {
  const store = useWheelchairStore.getState();
  store.setConnectionStatus('error');
  logger.error('CONNECTION', 'WebSocket error occurred');
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  const store = useWheelchairStore.getState();
  store.incrementReconnectAttempts();
  store.setConnectionStatus('connecting');

  logger.info(
    'CONNECTION',
    `Reconnecting in ${reconnectDelay / 1000}s (attempt ${store.reconnectAttempts + 1})`,
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectInternal();
    // Exponential backoff
    reconnectDelay = Math.min(reconnectDelay * RECONNECT_MULTIPLIER, MAX_RECONNECT_DELAY);
  }, reconnectDelay);
}

function connectInternal() {
  if (SIMULATION_MODE) {
    const store = useWheelchairStore.getState();
    store.setConnectionStatus('connected');
    logger.info('CONNECTION', 'Simulation mode active - bypassing WebSocket');
    
    // Initialize battery to 100 if it's 0
    if (store.telemetry.battery === 0) {
      store.updateTelemetry({ battery: 100, distance: 50, wifi_clients: 1 });
    }

    if (!simulationTimer) {
      simulationTimer = setInterval(() => {
        const s = useWheelchairStore.getState();
        const currentBattery = s.telemetry.battery;
        
        // Very slow simulated battery drain
        const newBattery = Math.random() > 0.95 ? Math.max(0, currentBattery - 1) : currentBattery;
        
        const simData: Partial<Telemetry> = {
          battery: newBattery,
          uptime: s.telemetry.uptime + 1,
          timestamp: Date.now(),
        };

        s.updateTelemetry(simData);
        listeners.forEach(fn => fn(s.telemetry));
      }, 1000);
    }
    return;
  }

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return; // Already connected or connecting
  }

  const url = getWsUrl();
  const store = useWheelchairStore.getState();
  store.setConnectionStatus('connecting');
  logger.info('CONNECTION', `Connecting WebSocket to ${url}`);

  try {
    ws = new WebSocket(url);
    ws.onopen = handleOpen;
    ws.onmessage = handleMessage;
    ws.onclose = handleClose;
    ws.onerror = handleError;
  } catch (err) {
    logger.error('CONNECTION', `Failed to create WebSocket: ${err}`);
    store.setConnectionStatus('error');
    if (shouldReconnect) {
      scheduleReconnect();
    }
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Connect to ESP32 WebSocket. Auto-reconnects on disconnect. */
export function connect() {
  shouldReconnect = true;
  reconnectDelay = INITIAL_RECONNECT_DELAY;
  connectInternal();
}

/** Disconnect from ESP32 and stop reconnection. */
export function disconnect() {
  shouldReconnect = false;
  if (simulationTimer) {
    clearInterval(simulationTimer);
    simulationTimer = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.onclose = null; // Prevent reconnect handler
    ws.close();
    ws = null;
  }
  const store = useWheelchairStore.getState();
  store.setConnectionStatus('disconnected');
  logger.info('CONNECTION', 'WebSocket disconnected (manual)');
}

/** Check if WebSocket is currently connected. */
export function isConnected(): boolean {
  if (SIMULATION_MODE) return true;
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

/** Subscribe to telemetry updates. Returns unsubscribe function. */
export function onTelemetry(callback: TelemetryCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Send a raw message through the WebSocket (for debugging). */
export function sendRaw(message: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message);
    logger.info('CONNECTION', `Sent raw WS message: ${message}`);
  } else {
    logger.warn('CONNECTION', 'Cannot send: WebSocket not connected');
  }
}
