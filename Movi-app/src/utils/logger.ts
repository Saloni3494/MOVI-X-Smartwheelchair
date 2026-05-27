// =============================================================================
// MOVI-X Logger — Centralized structured logging utility
// =============================================================================

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type LogCategory =
  | 'CONNECTION'
  | 'API'
  | 'SENSOR'
  | 'MOTOR'
  | 'SAFETY'
  | 'VOICE'
  | 'SYSTEM';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
}

type LogSubscriber = (entry: LogEntry) => void;

const MAX_LOGS = 500;
let logIdCounter = 0;
const logs: LogEntry[] = [];
const subscribers: Set<LogSubscriber> = new Set();

function generateId(): string {
  return `log_${Date.now()}_${++logIdCounter}`;
}

function createEntry(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: unknown,
): LogEntry {
  const entry: LogEntry = {
    id: generateId(),
    timestamp: Date.now(),
    level,
    category,
    message,
    data,
  };

  // Ring buffer — evict oldest when full
  if (logs.length >= MAX_LOGS) {
    logs.shift();
  }
  logs.push(entry);

  // Console output with color
  const prefix = `[${new Date(entry.timestamp).toLocaleTimeString()}] [${level}] [${category}]`;
  switch (level) {
    case 'INFO':
      console.log(`%c${prefix} ${message}`, 'color: #4a9eba', data ?? '');
      break;
    case 'WARNING':
      console.warn(`${prefix} ${message}`, data ?? '');
      break;
    case 'ERROR':
      console.error(`${prefix} ${message}`, data ?? '');
      break;
    case 'CRITICAL':
      console.error(`%c${prefix} ${message}`, 'color: #ff0000; font-weight: bold', data ?? '');
      break;
  }

  // Notify subscribers
  subscribers.forEach((fn) => {
    try {
      fn(entry);
    } catch {
      // Don't let subscriber errors break logging
    }
  });

  return entry;
}

export const logger = {
  info: (category: LogCategory, message: string, data?: unknown) =>
    createEntry('INFO', category, message, data),

  warn: (category: LogCategory, message: string, data?: unknown) =>
    createEntry('WARNING', category, message, data),

  error: (category: LogCategory, message: string, data?: unknown) =>
    createEntry('ERROR', category, message, data),

  critical: (category: LogCategory, message: string, data?: unknown) =>
    createEntry('CRITICAL', category, message, data),

  /** Get all logs currently in the buffer */
  getLogs: (): readonly LogEntry[] => logs,

  /** Filter logs by level and/or category */
  filterLogs: (level?: LogLevel, category?: LogCategory): LogEntry[] =>
    logs.filter(
      (l) => (!level || l.level === level) && (!category || l.category === category),
    ),

  /** Subscribe to new log entries in real-time */
  subscribe: (fn: LogSubscriber): (() => void) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },

  /** Clear all logs */
  clear: () => {
    logs.length = 0;
  },

  /** Export all logs as a downloadable JSON file */
  exportLogs: () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movi-x-logs-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
