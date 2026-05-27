// =============================================================================
// MOVI-X Hardware Service — REST API client for ESP32 commands
// =============================================================================

import { logger } from '@/utils/logger';
import { useWheelchairStore } from '@/store/wheelchairStore';
import type { MovementCommand, ModeCommand } from '@/utils/commandParser';
import * as twilio from './twilioService';
import { SIMULATION_MODE } from './websocketService';

const REQUEST_TIMEOUT = 3000; // 3 seconds

// ── Types ───────────────────────────────────────────────────────────────────
export interface ApiResponse {
  success: boolean;
  action?: string;
  timestamp?: number;
  mode?: string;
  message?: string;
  error?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function getBaseUrl(): string {
  const ip = useWheelchairStore.getState().esp32Ip;
  return `http://${ip}`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function apiCall(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: Record<string, unknown>,
): Promise<ApiResponse> {
  const url = `${getBaseUrl()}${endpoint}`;
  const startTime = performance.now();

  if (SIMULATION_MODE) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    const elapsed = Math.round(performance.now() - startTime);
    
    // Simulate updating state based on the endpoint
    const store = useWheelchairStore.getState();
    if (endpoint.includes('/movement/')) {
      const direction = endpoint.split('/').pop()?.toUpperCase() as any;
      store.updateTelemetry({ movement: direction });
    } else if (endpoint.includes('/mode/emergency')) {
      store.updateTelemetry({ emergency: true, movement: 'STOP' });
    } else if (endpoint.includes('/mode/')) {
      const mode = endpoint.split('/').pop()?.toUpperCase() as any;
      store.updateTelemetry({ mode });
    }
    
    const data: ApiResponse = { success: true, timestamp: Date.now() };
    logger.info('SIM_API', `${method} ${endpoint} → 200 (${elapsed}ms)`, {
      endpoint, status: 200, elapsed, response: data,
    });
    return data;
  }

  try {
    const response = await fetchWithTimeout(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const elapsed = Math.round(performance.now() - startTime);
    const data: ApiResponse = await response.json();

    logger.info('API', `${method} ${endpoint} → ${response.status} (${elapsed}ms)`, {
      endpoint,
      status: response.status,
      elapsed,
      response: data,
    });

    return data;
  } catch (err) {
    const elapsed = Math.round(performance.now() - startTime);
    const message =
      err instanceof DOMException && err.name === 'AbortError'
        ? `Request timeout after ${timeout}ms`
        : err instanceof Error
          ? err.message
          : 'Unknown error';

    logger.error('API', `${method} ${endpoint} FAILED (${elapsed}ms): ${message}`, {
      endpoint,
      elapsed,
      error: message,
    });

    return {
      success: false,
      error: message,
    };
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Send a movement command to the wheelchair */
export async function sendMovement(direction: MovementCommand): Promise<ApiResponse> {
  const response = await apiCall('POST', `/api/v1/movement/${direction}`);
  
  if (response.success && direction !== 'stop') {
    // Fire and forget SMS for movement
    twilio.sendSMS(`MOVI-X Alert: Wheelchair is now moving ${direction.toUpperCase()}.`);
  }
  
  return response;
}

/** Switch wheelchair operating mode */
export async function setMode(mode: ModeCommand): Promise<ApiResponse> {
  return apiCall('POST', `/api/v1/mode/${mode}`);
}

/** Send heartbeat ping to keep connection alive */
export async function sendHeartbeat(): Promise<ApiResponse> {
  const start = performance.now();
  const result = await apiCall('POST', '/api/v1/heartbeat');
  const latency = Math.round(performance.now() - start);

  const store = useWheelchairStore.getState();
  store.setHeartbeatLatency(latency);
  store.setLastHeartbeat(Date.now());

  return result;
}

/** Get full telemetry status from ESP32 */
export async function getStatus(): Promise<ApiResponse> {
  return apiCall('GET', '/api/v1/status');
}

/** Set wheelchair speed (0-100%) */
export async function setSpeed(percent: number): Promise<ApiResponse> {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return apiCall('POST', '/api/v1/speed', { speed: clamped });
}

/** Trigger emergency stop — highest priority command */
export async function emergencyStop(): Promise<ApiResponse> {
  logger.critical('SAFETY', 'Emergency stop triggered from app');
  
  // Fire and forget SOS SMS
  twilio.sendSMS(`🚨 MOVI-X EMERGENCY 🚨 SOS Button pressed! The wheelchair has been remotely stopped.`);
  
  return apiCall('POST', '/api/v1/mode/emergency');
}

/** Test connection to ESP32 */
export async function pingESP32(): Promise<{ reachable: boolean; latency: number }> {
  if (SIMULATION_MODE) return { reachable: true, latency: 15 };
  const start = performance.now();
  try {
    const response = await fetchWithTimeout(`${getBaseUrl()}/api/v1/status`, {}, 2000);
    const latency = Math.round(performance.now() - start);
    return { reachable: response.ok, latency };
  } catch {
    return { reachable: false, latency: -1 };
  }
}
