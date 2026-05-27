// =============================================================================
// MOVI-X useVoiceCommands Hook — React hook for voice command integration
// =============================================================================

import { useCallback } from 'react';
import { useWheelchairStore } from '@/store/wheelchairStore';
import * as voice from '@/services/voiceService';

/**
 * React hook for voice command integration.
 * Provides listening state, messages, and control functions.
 */
export function useVoiceCommands() {
  const isListening = useWheelchairStore((s) => s.isListening);
  const voiceMessages = useWheelchairStore((s) => s.voiceMessages);

  const startListening = useCallback((requireWakeWord = false) => {
    voice.startListening(requireWakeWord);
  }, []);

  const stopListening = useCallback(() => {
    voice.stopListening();
  }, []);

  const toggleListening = useCallback(() => {
    if (voice.getIsListening()) {
      voice.stopListening();
    } else {
      voice.startListening(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    useWheelchairStore.getState().clearVoiceMessages();
  }, []);

  const speak = useCallback((text: string) => {
    voice.speak(text);
  }, []);

  return {
    isListening,
    voiceMessages,
    isSupported: voice.isSupported(),
    startListening,
    stopListening,
    toggleListening,
    clearMessages,
    speak,
  };
}
