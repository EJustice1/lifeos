/**
 * Execution Score Validator
 *
 * Calculates suggested execution score range based on objective behavioral data.
 * Implements "cheat detection" by potentially locking scores when data contradicts self-assessment.
 */

export interface DailyMetrics {
  studyMinutes: number
  studyTarget: number // User's daily goal (from settings)
  workoutsCompleted: number
  workoutsTarget: number // User's daily goal (from settings)
  screenTimeMinutes: number
  yesterdayGoalsCompleted: number
  yesterdayGoalsTotal: number
}

export interface ValidationResult {
  minScore: number // Minimum allowed score
  maxScore: number // Maximum allowed score
  suggestedScore: number // Algorithm's recommendation
  suggestions: string[] // Human-readable explanations
  locked: boolean // Whether the score range is capped
}

/**
 * Calculate execution score range based on behavioral data
 */
export function calculateExecutionRange(metrics: DailyMetrics): ValidationResult {
  let minScore = 0
  let maxScore = 100
  const suggestions: string[] = []

  // ============================================
  // HARD CAPS (Negative behaviors)
  // ============================================

  // If total screentime > 8h (480 min) - SABOTAGE level
  if (metrics.screenTimeMinutes > 480) {
    maxScore = Math.min(maxScore, 15)
    suggestions.push('Excessive screentime detected (>8h). Max capped at Sabotage.')
  }
  // If total screentime > 6h (360 min) - MAINTENANCE level
  else if (metrics.screenTimeMinutes > 360) {
    maxScore = Math.min(maxScore, 50)
    suggestions.push('High screentime (>6h). Max capped at Maintenance.')
  }

  // If study < 1 hour AND screentime > 6 hours - UNFOCUSED level
  if (metrics.studyMinutes < 60 && metrics.screenTimeMinutes > 360) {
    maxScore = Math.min(maxScore, 40)
    suggestions.push('Low study + high screentime. Max capped at Unfocused.')
  }

  // ============================================
  // POSITIVE BOOSTS (Achievements)
  // ============================================

  // If met all yesterday's goals - Minimum MAINTENANCE
  if (
    metrics.yesterdayGoalsTotal > 0 &&
    metrics.yesterdayGoalsCompleted === metrics.yesterdayGoalsTotal
  ) {
    minScore = Math.max(minScore, 50)
    suggestions.push('All goals completed! Minimum: Maintenance.')
  }

  // If hit study target AND hit workout target - Minimum TRACTION
  if (
    metrics.studyMinutes >= metrics.studyTarget &&
    metrics.workoutsCompleted >= metrics.workoutsTarget
  ) {
    minScore = Math.max(minScore, 65)
    suggestions.push('Hit study + gym targets. Minimum: Traction.')
  }

  // Simplified: No productivity rate calculation since we removed the productive/unproductive split
  // Screen time is just a penalty now, not a productivity metric

  // ============================================
  // SUGGESTED SCORE (Weighted algorithm)
  // ============================================

  let suggestedScore = 50 // Default to Maintenance

  // Calculate domain scores (0-100)
  const studyScore = Math.min(100, (metrics.studyMinutes / metrics.studyTarget) * 100)
  const gymScore = Math.min(
    100,
    (metrics.workoutsCompleted / metrics.workoutsTarget) * 100
  )
  const goalScore =
    metrics.yesterdayGoalsTotal > 0
      ? (metrics.yesterdayGoalsCompleted / metrics.yesterdayGoalsTotal) * 100
      : 50
  const screenScore = 100 - Math.min(100, (metrics.screenTimeMinutes / 360) * 100)

  // Weighted average
  suggestedScore = Math.round(
    studyScore * 0.35 + gymScore * 0.25 + goalScore * 0.2 + screenScore * 0.2
  )

  // Map to nearest level (7-point scale)
  const levels = [10, 25, 40, 50, 65, 80, 95]
  const suggested = levels.reduce((prev, curr) =>
    Math.abs(curr - suggestedScore) < Math.abs(prev - suggestedScore) ? curr : prev
  )

  // Ensure suggested score is within allowed range
  const finalSuggested = Math.max(minScore, Math.min(maxScore, suggested))

  return {
    minScore,
    maxScore,
    suggestedScore: finalSuggested,
    suggestions,
    locked: maxScore < 100,
  }
}

/**
 * Get the execution level details for a given score
 */
export interface ExecutionLevel {
  value: number
  label: string
  range: string
  emoji: string
  color: string
  description: string
  criteria: string[]
  mindset: string
}

export const EXECUTION_LEVELS: ExecutionLevel[] = [
  // NEGATIVE ZONE (Entropy)
  {
    value: 10,
    label: 'Sabotage',
    range: '0-15%',
    emoji: '🛑',
    color: 'text-red-600',
    description: 'Actively harmed progress',
    criteria: [
      'Skipped planned gym session with no valid reason',
      'Binge behavior (eating/spending/content)',
      'Screentime > 5 hours of pure distraction',
    ],
    mindset: 'I dug a hole today that I have to climb out of tomorrow',
  },
  {
    value: 25,
    label: 'Decay',
    range: '16-30%',
    emoji: '📉',
    color: 'text-red-400',
    description: 'Pure procrastination',
    criteria: [
      'Knew what to do, chose comfort instead',
      'Missed study timers completely',
      'Screentime displaced sleep or work',
    ],
    mindset: 'I let the day happen to me',
  },
  {
    value: 40,
    label: 'Unfocused',
    range: '31-45%',
    emoji: '🌀',
    color: 'text-orange-400',
    description: 'High effort, low output',
    criteria: [
      'Started tasks but got distracted constantly',
      'Study timer paused frequently',
      'Went to gym but had "junk volume" workout',
    ],
    mindset: 'I was scattered and unfocused all day',
  },

  // NEUTRAL ZONE (Baseline)
  {
    value: 50,
    label: 'Maintenance',
    range: '46-55%',
    emoji: '⚓',
    color: 'text-yellow-400',
    description: 'Compliance without intensity',
    criteria: [
      'All checkboxes ticked on paper',
      'Budget safe, screentime average',
      'Zero passion or extra effort',
    ],
    mindset: 'I punched the clock. I survived',
  },

  // POSITIVE ZONE (Growth)
  {
    value: 65,
    label: 'Traction',
    range: '56-70%',
    emoji: '📈',
    color: 'text-green-400',
    description: 'Intentionality won battles',
    criteria: [
      'Resisted impulses successfully',
      'Screentime lower than average',
      'Study goals met with focus',
      'Did more than bare minimum',
    ],
    mindset: 'I am better off tonight than I was this morning',
  },
  {
    value: 80,
    label: 'Velocity',
    range: '71-85%',
    emoji: '🚀',
    color: 'text-emerald-400',
    description: 'High leverage actions',
    criteria: [
      'Tackled "Hardest Thing" first',
      'Deep work recorded',
      'Proactive, not reactive',
      'Financial restraint + physical energy high',
    ],
    mindset: 'I moved the needle significantly',
  },
  {
    value: 95,
    label: 'Apex',
    range: '86-100%',
    emoji: '👑',
    color: 'text-purple-400',
    description: 'Flow state achieved',
    criteria: [
      'Perfect congruence between thought and action',
      'Personal Best in Gym or Study',
      'Zero doomscrolling',
      'Capabilities pushed to limit',
    ],
    mindset: 'I was unstoppable',
  },
]

/**
 * Find the execution level for a given score
 */
export function findExecutionLevel(score: number): ExecutionLevel {
  // Find the closest level
  const closest = EXECUTION_LEVELS.reduce((prev, curr) =>
    Math.abs(curr.value - score) < Math.abs(prev.value - score) ? curr : prev
  )
  return closest
}
