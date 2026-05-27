// =============================================================================
// MOVI-X Voice Service — Web Speech API integration for voice commands
// =============================================================================

import { logger } from '@/utils/logger';
import {
  parseCommand,
  containsWakeWord,
  getCommandFeedback,
  type ParsedCommand,
} from '@/utils/commandParser';
import { sendMovement, setMode, emergencyStop } from '@/services/hardwareService';
import { useWheelchairStore } from '@/store/wheelchairStore';

// ── Types ───────────────────────────────────────────────────────────────────
type VoiceCallback = (transcript: string, command: ParsedCommand | null) => void;

// ── Check browser support ───────────────────────────────────────────────────
const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;

// ── Module state ────────────────────────────────────────────────────────────
let recognition: any = null;
let isActive = false;
let wakeWordRequired = false;
let wakeWordDetected = false;
const callbacks: Set<VoiceCallback> = new Set();

// ── Private helpers ─────────────────────────────────────────────────────────

async function executeCommand(cmd: ParsedCommand) {
  const store = useWheelchairStore.getState();
  const feedback = getCommandFeedback(cmd);

  // Add bot response to voice messages
  store.addVoiceMessage({
    id: `bot_${Date.now()}`,
    from: 'bot',
    text: feedback,
    timestamp: Date.now(),
  });

  // Execute the command
  if (cmd.type === 'movement') {
    await sendMovement(cmd.command as any);
  } else if (cmd.command === 'emergency') {
    await emergencyStop();
  } else {
    await setMode(cmd.command as any);
  }

  // Voice feedback
  speak(feedback);

  logger.info('VOICE', `Executed: ${cmd.command} (confidence: ${(cmd.confidence * 100).toFixed(0)}%)`, cmd);
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Check if Web Speech API is available in this browser */
export function isSupported(): boolean {
  return SpeechRecognition !== null;
}

/** Speak text aloud using speech synthesis */
export function speak(text: string) {
  if (!speechSynth) return;
  // Cancel any ongoing speech
  speechSynth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;
  speechSynth.speak(utterance);
}

/**
 * Start continuous voice recognition.
 * @param requireWakeWord If true, commands only execute after "Hey Movi" is detected
 */
export function startListening(requireWakeWord = false) {
  if (!SpeechRecognition) {
    logger.error('VOICE', 'Speech recognition not supported in this browser');
    return;
  }

  if (isActive) {
    logger.warn('VOICE', 'Already listening');
    return;
  }

  wakeWordRequired = requireWakeWord;
  wakeWordDetected = false;

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isActive = true;
    useWheelchairStore.getState().setIsListening(true);
    logger.info('VOICE', 'Voice recognition started');
  };

  recognition.onresult = (event: any) => {
    const last = event.results[event.results.length - 1];
    if (!last.isFinal) return;

    const transcript = last[0].transcript.trim();
    logger.info('VOICE', `Heard: "${transcript}"`);

    // Add user message
    const store = useWheelchairStore.getState();
    store.addVoiceMessage({
      id: `user_${Date.now()}`,
      from: 'user',
      text: transcript,
      timestamp: Date.now(),
    });

    // Check wake word if required
    if (wakeWordRequired && !wakeWordDetected) {
      if (containsWakeWord(transcript)) {
        wakeWordDetected = true;
        speak("I'm listening");
        store.addVoiceMessage({
          id: `bot_wake_${Date.now()}`,
          from: 'bot',
          text: "I'm listening! What would you like me to do?",
          timestamp: Date.now(),
        });
        logger.info('VOICE', 'Wake word detected');
      }

      callbacks.forEach((fn) => fn(transcript, null));
      return;
    }

    // Parse and execute command
    const cmd = parseCommand(transcript);

    if (cmd) {
      executeCommand(cmd);
      // Reset wake word state for next command
      if (wakeWordRequired) wakeWordDetected = false;
    } else {
      store.addVoiceMessage({
        id: `bot_unknown_${Date.now()}`,
        from: 'bot',
        text: `I didn't understand "${transcript}". Try saying "move forward", "stop", or "turn left".`,
        timestamp: Date.now(),
      });
      logger.warn('VOICE', `Unrecognized command: "${transcript}"`);
    }

    callbacks.forEach((fn) => fn(transcript, cmd));
  };

  recognition.onerror = (event: any) => {
    logger.error('VOICE', `Recognition error: ${event.error}`);
    // Auto-restart on non-fatal errors
    if (event.error === 'no-speech' || event.error === 'aborted') {
      if (isActive) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    }
  };

  recognition.onend = () => {
    // Auto-restart if still supposed to be active
    if (isActive) {
      try {
        recognition.start();
      } catch {
        isActive = false;
        useWheelchairStore.getState().setIsListening(false);
      }
    } else {
      useWheelchairStore.getState().setIsListening(false);
    }
  };

  try {
    recognition.start();
  } catch (err) {
    logger.error('VOICE', `Failed to start recognition: ${err}`);
  }
}

/** Stop voice recognition */
export function stopListening() {
  isActive = false;
  wakeWordDetected = false;
  if (recognition) {
    try { recognition.stop(); } catch { /* ignore */ }
    recognition = null;
  }
  useWheelchairStore.getState().setIsListening(false);
  logger.info('VOICE', 'Voice recognition stopped');
}

/** Subscribe to voice recognition results */
export function onResult(callback: VoiceCallback): () => void {
  callbacks.add(callback);
  return () => callbacks.delete(callback);
}

/** Check if currently listening */
export function getIsListening(): boolean {
  return isActive;
}
