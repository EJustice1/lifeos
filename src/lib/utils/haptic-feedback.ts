/**
 * Haptic feedback utility for mobile devices
 * Provides tactile feedback for user interactions
 */

export const triggerHapticFeedback = (pattern: number | number[] = 10): void => {
  // Only trigger on mobile devices with touch support
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    try {
      // Check if Vibration API is available
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      console.log('Haptic feedback not supported on this device');
    }
  }
};

export const HapticPatterns = {
  SELECTION: 10, // Short tap for selection
  SUCCESS: [20, 10, 20], // Success pattern
  WARNING: [10, 20, 10], // Warning pattern
  FAILURE: [100, 50, 100], // Failure pattern
  LIGHT: 5, // Very light feedback
  MEDIUM: 20, // Medium feedback
  HEAVY: 40, // Heavy feedback
} as const;

export type HapticPattern = keyof typeof HapticPatterns;