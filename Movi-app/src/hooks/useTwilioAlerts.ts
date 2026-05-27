import { useEffect, useRef } from 'react';
import { useWheelchairStore } from '@/store/wheelchairStore';
import * as twilio from '@/services/twilioService';

export function useTwilioAlerts() {
  const isObstacle = useWheelchairStore((s) => s.telemetry.obstacle);
  const distance = useWheelchairStore((s) => s.telemetry.distance);
  
  // Track previous state to only trigger on the leading edge (false -> true)
  const prevObstacle = useRef(false);

  useEffect(() => {
    if (isObstacle && !prevObstacle.current) {
      // Obstacle just detected
      twilio.sendSMS(`⚠️ MOVI-X WARNING: Obstacle detected at ${distance}cm. Forward movement blocked for safety.`);
    }
    
    prevObstacle.current = isObstacle;
  }, [isObstacle, distance]);
}
