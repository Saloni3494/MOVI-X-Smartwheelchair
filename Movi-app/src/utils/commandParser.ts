// =============================================================================
// MOVI-X Command Parser — Natural language → wheelchair command mapping
// =============================================================================

export type MovementCommand = 'forward' | 'backward' | 'left' | 'right' | 'stop';
export type ModeCommand = 'manual' | 'voice' | 'emg' | 'emergency';
export type CommandType = 'movement' | 'mode';

export interface ParsedCommand {
  type: CommandType;
  command: MovementCommand | ModeCommand;
  confidence: number;
  rawText: string;
}

interface CommandPattern {
  type: CommandType;
  command: MovementCommand | ModeCommand;
  patterns: string[];
}

const COMMAND_PATTERNS: CommandPattern[] = [
  // Movement commands
  {
    type: 'movement',
    command: 'forward',
    patterns: [
      'move forward', 'go forward', 'drive forward', 'go ahead',
      'forward', 'move ahead', 'go straight', 'straight',
      'move up', 'advance', 'proceed',
    ],
  },
  {
    type: 'movement',
    command: 'backward',
    patterns: [
      'move backward', 'go backward', 'go back', 'reverse',
      'backward', 'move back', 'back up', 'drive back',
      'retreat',
    ],
  },
  {
    type: 'movement',
    command: 'left',
    patterns: [
      'turn left', 'go left', 'move left', 'left',
      'rotate left', 'steer left',
    ],
  },
  {
    type: 'movement',
    command: 'right',
    patterns: [
      'turn right', 'go right', 'move right', 'right',
      'rotate right', 'steer right',
    ],
  },
  {
    type: 'movement',
    command: 'stop',
    patterns: [
      'stop', 'halt', 'brake', 'freeze', 'hold',
      'stop moving', 'don\'t move', 'pause', 'wait',
    ],
  },
  // Mode commands
  {
    type: 'mode',
    command: 'manual',
    patterns: [
      'manual mode', 'switch to manual', 'manual control',
      'manual', 'hand control',
    ],
  },
  {
    type: 'mode',
    command: 'voice',
    patterns: [
      'voice mode', 'voice control', 'switch to voice',
      'listen mode', 'speech mode',
    ],
  },
  {
    type: 'mode',
    command: 'emg',
    patterns: [
      'emg mode', 'muscle mode', 'switch to emg',
      'emg control', 'muscle control', 'electro mode',
    ],
  },
  {
    type: 'mode',
    command: 'emergency',
    patterns: [
      'emergency', 'emergency stop', 'help', 'sos',
      'emergency mode', 'panic', 'danger', 'mayday',
    ],
  },
];

/**
 * Levenshtein distance between two strings (edit distance).
 * Used for fuzzy command matching.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Compute similarity score (0–1) between two strings using Levenshtein distance.
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Parse natural language text into a wheelchair command.
 * Returns the best matching command with confidence score.
 * Returns null if no command matches above the threshold.
 */
export function parseCommand(text: string, threshold = 0.55): ParsedCommand | null {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;

  let bestMatch: ParsedCommand | null = null;
  let bestScore = 0;

  for (const pattern of COMMAND_PATTERNS) {
    for (const phrase of pattern.patterns) {
      // Exact substring match → highest confidence
      if (normalized.includes(phrase)) {
        const score = phrase.length / normalized.length;
        const confidence = Math.max(0.85, Math.min(1, score + 0.15));
        if (confidence > bestScore) {
          bestScore = confidence;
          bestMatch = {
            type: pattern.type,
            command: pattern.command,
            confidence,
            rawText: text,
          };
        }
      } else {
        // Fuzzy match for close misses
        const score = similarity(normalized, phrase);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: pattern.type,
            command: pattern.command,
            confidence: score,
            rawText: text,
          };
        }
      }
    }
  }

  if (bestMatch && bestMatch.confidence >= threshold) {
    return bestMatch;
  }

  return null;
}

/**
 * Check if the given text contains the wake word "Hey Movi".
 */
export function containsWakeWord(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return (
    normalized.includes('hey movi') ||
    normalized.includes('hey movie') ||  // common misrecognition
    normalized.includes('hey moby') ||
    normalized.includes('he movi') ||
    similarity(normalized.split(' ').slice(0, 2).join(' '), 'hey movi') > 0.7
  );
}

/**
 * Get a human-readable description of a command for voice feedback.
 */
export function getCommandFeedback(command: ParsedCommand): string {
  const feedbacks: Record<string, string> = {
    forward: 'Moving forward',
    backward: 'Moving backward',
    left: 'Turning left',
    right: 'Turning right',
    stop: 'Stopping',
    manual: 'Switching to manual mode',
    voice: 'Switching to voice mode',
    emg: 'Switching to EMG mode',
    emergency: 'Emergency stop activated',
  };
  return feedbacks[command.command] || `Executing ${command.command}`;
}
