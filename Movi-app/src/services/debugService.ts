// =============================================================================
// MOVI-X Debug Service — Bridges logger into Zustand store for UI rendering
// =============================================================================

import { logger } from '@/utils/logger';
import { useWheelchairStore } from '@/store/wheelchairStore';
import type { LogEntry } from '@/utils/logger';

let initialized = false;

/**
 * Initialize the debug service.
 * Subscribes to the centralized logger and pipes entries into the Zustand store
 * so the Debug Console screen can render them in real-time.
 *
 * Safe to call multiple times — only initializes once.
 */
export function initDebugService() {
  if (initialized) return;
  initialized = true;

  logger.subscribe((entry: LogEntry) => {
    useWheelchairStore.getState().addDebugLog(entry);
  });

  logger.info('SYSTEM', 'Debug service initialized');
}

/**
 * Get filtered logs from the store based on current filter settings.
 */
export function getFilteredLogs(): LogEntry[] {
  const store = useWheelchairStore.getState();
  let logs = store.debugLogs;

  if (store.debugFilterLevel) {
    logs = logs.filter((l) => l.level === store.debugFilterLevel);
  }
  if (store.debugFilterCategory) {
    logs = logs.filter((l) => l.category === store.debugFilterCategory);
  }

  return logs;
}

/**
 * Search logs by text query.
 */
export function searchLogs(query: string): LogEntry[] {
  const normalized = query.toLowerCase();
  return useWheelchairStore
    .getState()
    .debugLogs.filter(
      (l) =>
        l.message.toLowerCase().includes(normalized) ||
        l.category.toLowerCase().includes(normalized) ||
        l.level.toLowerCase().includes(normalized),
    );
}

/**
 * Get statistics about current log entries.
 */
export function getLogStats(): {
  total: number;
  info: number;
  warning: number;
  error: number;
  critical: number;
} {
  const logs = useWheelchairStore.getState().debugLogs;
  return {
    total: logs.length,
    info: logs.filter((l) => l.level === 'INFO').length,
    warning: logs.filter((l) => l.level === 'WARNING').length,
    error: logs.filter((l) => l.level === 'ERROR').length,
    critical: logs.filter((l) => l.level === 'CRITICAL').length,
  };
}
