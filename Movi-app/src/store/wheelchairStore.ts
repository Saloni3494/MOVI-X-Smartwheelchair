// =============================================================================
// MOVI-X Wheelchair Store — Central Zustand state management
// =============================================================================

import { create } from 'zustand';
import type { LogEntry, LogLevel, LogCategory } from '@/utils/logger';

// ── Telemetry shape (mirrors ESP32 JSON) ────────────────────────────────────
export interface Telemetry {
  distance: number;
  mode: WheelchairMode;
  movement: MovementState;
  emg: number;
  latitude: number;
  longitude: number;
  battery: number;
  connection: boolean;
  obstacle: boolean;
  emergency: boolean;
  wifi_clients: number;
  uptime: number;
  signal_strength: number;
  speed: number;
  servo_angle: number;
  timestamp: number;
}

export type WheelchairMode =
  | 'IDLE'
  | 'MANUAL'
  | 'VOICE'
  | 'EMG'
  | 'AUTONOMOUS'
  | 'OBSTACLE_AVOIDANCE'
  | 'EMERGENCY';

export type MovementState = 'STOP' | 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ── Store interface ─────────────────────────────────────────────────────────
interface WheelchairStore {
  // Connection
  esp32Ip: string;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  heartbeatLatency: number;
  lastHeartbeat: number;

  // Telemetry
  telemetry: Telemetry;

  // Debug
  debugLogs: LogEntry[];
  debugFilterLevel: LogLevel | null;
  debugFilterCategory: LogCategory | null;

  // Voice
  voiceMessages: VoiceMessage[];
  isListening: boolean;

  // Settings
  speedLimit: number;         // 0-100
  obstacleThreshold: number;  // cm
  showDebugTab: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────
  setEsp32Ip: (ip: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  setHeartbeatLatency: (ms: number) => void;
  setLastHeartbeat: (ts: number) => void;

  updateTelemetry: (data: Partial<Telemetry>) => void;

  addDebugLog: (entry: LogEntry) => void;
  clearDebugLogs: () => void;
  setDebugFilterLevel: (level: LogLevel | null) => void;
  setDebugFilterCategory: (category: LogCategory | null) => void;

  addVoiceMessage: (msg: VoiceMessage) => void;
  clearVoiceMessages: () => void;
  setIsListening: (v: boolean) => void;

  setSpeedLimit: (v: number) => void;
  setObstacleThreshold: (v: number) => void;
  setShowDebugTab: (v: boolean) => void;
}

export interface VoiceMessage {
  id: string;
  from: 'user' | 'bot';
  text: string;
  timestamp: number;
}

// ── Default telemetry ───────────────────────────────────────────────────────
const defaultTelemetry: Telemetry = {
  distance: 0,
  mode: 'IDLE',
  movement: 'STOP',
  emg: 0,
  latitude: 0,
  longitude: 0,
  battery: 0,
  connection: false,
  obstacle: false,
  emergency: false,
  wifi_clients: 0,
  uptime: 0,
  signal_strength: 0,
  speed: 0,
  servo_angle: 90,
  timestamp: 0,
};

const MAX_DEBUG_LOGS = 500;
const MAX_VOICE_MESSAGES = 100;

// ── Store ───────────────────────────────────────────────────────────────────
export const useWheelchairStore = create<WheelchairStore>((set) => ({
  // Initial state
  esp32Ip: '192.168.4.1',
  connectionStatus: 'disconnected',
  reconnectAttempts: 0,
  heartbeatLatency: 0,
  lastHeartbeat: 0,

  telemetry: { ...defaultTelemetry },

  debugLogs: [],
  debugFilterLevel: null,
  debugFilterCategory: null,

  voiceMessages: [
    {
      id: 'welcome',
      from: 'bot',
      text: "Hi! I'm MOVI-X AI. You can ask me to navigate, control the wheelchair, or call for help.",
      timestamp: Date.now(),
    },
  ],
  isListening: false,

  speedLimit: 70,
  obstacleThreshold: 20,
  showDebugTab: false,

  // Actions
  setEsp32Ip: (ip) => set({ esp32Ip: ip }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  incrementReconnectAttempts: () =>
    set((s) => ({ reconnectAttempts: s.reconnectAttempts + 1 })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
  setHeartbeatLatency: (ms) => set({ heartbeatLatency: ms }),
  setLastHeartbeat: (ts) => set({ lastHeartbeat: ts }),

  updateTelemetry: (data) =>
    set((s) => ({ telemetry: { ...s.telemetry, ...data } })),

  addDebugLog: (entry) =>
    set((s) => {
      const logs = [...s.debugLogs, entry];
      if (logs.length > MAX_DEBUG_LOGS) logs.shift();
      return { debugLogs: logs };
    }),

  clearDebugLogs: () => set({ debugLogs: [] }),

  setDebugFilterLevel: (level) => set({ debugFilterLevel: level }),
  setDebugFilterCategory: (category) => set({ debugFilterCategory: category }),

  addVoiceMessage: (msg) =>
    set((s) => {
      const msgs = [...s.voiceMessages, msg];
      if (msgs.length > MAX_VOICE_MESSAGES) msgs.shift();
      return { voiceMessages: msgs };
    }),

  clearVoiceMessages: () => set({ voiceMessages: [] }),
  setIsListening: (v) => set({ isListening: v }),

  setSpeedLimit: (v) => set({ speedLimit: v }),
  setObstacleThreshold: (v) => set({ obstacleThreshold: v }),
  setShowDebugTab: (v) => set({ showDebugTab: v }),
}));
