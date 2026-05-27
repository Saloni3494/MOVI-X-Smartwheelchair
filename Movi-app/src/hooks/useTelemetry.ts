// =============================================================================
// MOVI-X useTelemetry Hook — Derived telemetry with computed display values
// =============================================================================

import { useMemo } from 'react';
import { useWheelchairStore } from '@/store/wheelchairStore';

export function useTelemetry() {
  const telemetry = useWheelchairStore((s) => s.telemetry);
  const connectionStatus = useWheelchairStore((s) => s.connectionStatus);

  return useMemo(() => {
    const t = telemetry;

    // Battery
    const batteryLevel = t.battery;
    const batteryStatus: 'critical' | 'low' | 'good' | 'full' =
      batteryLevel <= 10
        ? 'critical'
        : batteryLevel <= 25
          ? 'low'
          : batteryLevel <= 80
            ? 'good'
            : 'full';

    // Distance / obstacles
    const distanceStatus: 'danger' | 'warning' | 'safe' =
      t.distance > 0 && t.distance < 20
        ? 'danger'
        : t.distance >= 20 && t.distance < 50
          ? 'warning'
          : 'safe';

    const isObstacleDetected = t.obstacle || (t.distance > 0 && t.distance < 20);

    // GPS
    const hasGps = t.latitude !== 0 || t.longitude !== 0;
    const gpsCoordinates = hasGps
      ? `${t.latitude.toFixed(4)}°, ${t.longitude.toFixed(4)}°`
      : 'No GPS lock';

    // Uptime
    const uptimeSeconds = Math.floor(t.uptime / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const secs = uptimeSeconds % 60;
    const uptimeFormatted =
      hours > 0
        ? `${hours}h ${minutes}m`
        : minutes > 0
          ? `${minutes}m ${secs}s`
          : `${secs}s`;

    // Signal strength
    const signalStrengthLabel: 'excellent' | 'good' | 'fair' | 'poor' =
      t.signal_strength > -50
        ? 'excellent'
        : t.signal_strength > -60
          ? 'good'
          : t.signal_strength > -70
            ? 'fair'
            : 'poor';

    // Speed display
    const speedDisplay = `${((t.speed / 100) * 4.2).toFixed(1)}km/h`;

    // Mode display
    const modeDisplay = t.mode.charAt(0) + t.mode.slice(1).toLowerCase();

    // Movement display
    const movementDisplay = t.movement.charAt(0) + t.movement.slice(1).toLowerCase();

    // Connection display
    const isConnected = connectionStatus === 'connected';
    const connectionLabel =
      connectionStatus === 'connected'
        ? 'Connected'
        : connectionStatus === 'connecting'
          ? 'Connecting...'
          : connectionStatus === 'error'
            ? 'Error'
            : 'Disconnected';

    // EMG display
    const emgLevel: 'low' | 'medium' | 'high' =
      t.emg < 1000 ? 'low' : t.emg < 2500 ? 'medium' : 'high';

    // System status text
    const systemStatus = t.emergency
      ? 'EMERGENCY ACTIVE'
      : t.obstacle
        ? 'Obstacle detected'
        : isConnected
          ? 'All systems active'
          : 'Disconnected';

    return {
      raw: t,
      batteryLevel,
      batteryStatus,
      batteryDisplay: `${batteryLevel}%`,
      distanceStatus,
      distanceDisplay: `${t.distance}cm`,
      isObstacleDetected,
      hasGps,
      gpsCoordinates,
      uptimeFormatted,
      signalStrengthLabel,
      signalDisplay: `${t.signal_strength}dBm`,
      speedDisplay,
      modeDisplay,
      movementDisplay,
      isConnected,
      connectionLabel,
      emgValue: t.emg,
      emgLevel,
      systemStatus,
      isEmergency: t.emergency,
      wifiClients: t.wifi_clients,
      servoAngle: t.servo_angle,
    };
  }, [telemetry, connectionStatus]);
}
