// =============================================================================
// MOVI-X Twilio Service — SMS Alerts
// =============================================================================

import { logger } from '@/utils/logger';

const ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const FROM_NUMBER = import.meta.env.VITE_TWILIO_FROM_NUMBER;
const TO_NUMBER = import.meta.env.VITE_TWILIO_TO_NUMBER;

// Keep track of recent messages to prevent spamming the Twilio API and draining credits
const recentMessages = new Map<string, number>();
const SPAM_THROTTLE_MS = 10000; // 10 seconds between identical messages

export async function sendSMS(message: string): Promise<boolean> {
  const now = Date.now();
  const lastSent = recentMessages.get(message);

  // Spam prevention: don't send the exact same message if we just sent it seconds ago
  if (lastSent && now - lastSent < SPAM_THROTTLE_MS) {
    logger.info('TWILIO', `SMS throttled to prevent spam: "${message}"`);
    return false;
  }
  
  recentMessages.set(message, now);
  logger.info('TWILIO', `Sending SMS: "${message}"`);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;

  const body = new URLSearchParams();
  body.append('To', TO_NUMBER);
  body.append('From', FROM_NUMBER);
  body.append('Body', message);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
      },
      body: body.toString(),
    });

    if (response.ok) {
      logger.info('TWILIO', `SMS Sent Successfully`);
      return true;
    } else {
      const errorData = await response.json();
      logger.error('TWILIO', `Failed to send SMS: ${JSON.stringify(errorData)}`);
      return false;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown network error';
    logger.error('TWILIO', `Network error sending SMS (Check internet connection): ${errorMessage}`);
    return false;
  }
}
