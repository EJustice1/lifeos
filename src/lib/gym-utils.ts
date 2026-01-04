// Muscle groups for the radar chart
export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'core',
] as const

export type MuscleGroup = typeof MUSCLE_GROUPS[number]

// Calculate estimated 1RM using Brzycki formula
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps >= 37) return weight // Avoid division by zero/negative
  return Math.round(weight * (36 / (37 - reps)))
}

// Comprehensive predefined exercises with primary and secondary muscle groups
export const PREDEFINED_EXERCISES = [
  // Push Exercises
  {
    id: 1,
    name: 'Bench Press',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 135
  },
  {
    id: 2,
    name: 'Incline Bench Press',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 115
  },
  {
    id: 3,
    name: 'Decline Bench Press',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps'],
    category: 'push',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 115
  },
  {
    id: 4,
    name: 'Dumbbell Bench Press',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 50
  },
  {
    id: 5,
    name: 'Overhead Press (Barbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['triceps'],
    category: 'push',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 95
  },
  {
    id: 6,
    name: 'Overhead Press (Dumbbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['triceps'],
    category: 'push',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 40
  },
  {
    id: 7,
    name: 'Push-ups',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 8,
    name: 'Dips (Chest Focus)',
    primary_muscles: ['triceps'],
    secondary_muscles: ['chest', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 9,
    name: 'Tricep Pushdown (Rope)',
    primary_muscles: ['triceps'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 50
  },
  {
    id: 10,
    name: 'Tricep Pushdown (Bar)',
    primary_muscles: ['triceps'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 40
  },
  {
    id: 11,
    name: 'Skull Crushers',
    primary_muscles: ['triceps'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'barbell',
    default_weight: 30
  },
  {
    id: 12,
    name: 'Lateral Raises',
    primary_muscles: ['shoulders'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 15
  },
  {
    id: 13,
    name: 'Front Raises',
    primary_muscles: ['shoulders'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 15
  },
  {
    id: 14,
    name: 'Rear Delt Flyes',
    primary_muscles: ['shoulders'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'machine',
    default_weight: 40
  },
  {
    id: 15,
    name: 'Cable Flyes (Low to High)',
    primary_muscles: ['chest'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 20
  },
  {
    id: 16,
    name: 'Cable Flyes (Mid)',
    primary_muscles: ['chest'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 20
  },
  {
    id: 17,
    name: 'Pec Deck Fly',
    primary_muscles: ['chest'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'machine',
    default_weight: 50
  },
  {
    id: 18,
    name: 'Machine Shoulder Press',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['triceps'],
    category: 'push',
    is_compound: true,
    equipment: 'machine',
    default_weight: 40
  },

  // Pull Exercises
  {
    id: 20,
    name: 'Deadlift (Conventional)',
    primary_muscles: ['back', 'hamstrings'],
    secondary_muscles: ['glutes', 'core', 'forearms'],
    category: 'pull',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 225
  },
  {
    id: 21,
    name: 'Deadlift (Sumo)',
    primary_muscles: ['hamstrings', 'glutes'],
    secondary_muscles: ['back', 'core', 'quadriceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 225
  },
  {
    id: 22,
    name: 'Barbell Row',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps', 'core'],
    category: 'pull',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 135
  },
  {
    id: 23,
    name: 'Pull-ups (Overhand)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 24,
    name: 'Pull-ups (Underhand/Chin-ups)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 25,
    name: 'Lat Pulldown (Wide Grip)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'machine',
    default_weight: 80
  },
  {
    id: 26,
    name: 'Lat Pulldown (Close Grip)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'machine',
    default_weight: 70
  },
  {
    id: 27,
    name: 'Seated Cable Row (Neutral Grip)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'cable',
    default_weight: 80
  },
  {
    id: 28,
    name: 'Seated Cable Row (Wide Grip)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'cable',
    default_weight: 70
  },
  {
    id: 29,
    name: 'Dumbbell Row (Single Arm)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps', 'core'],
    category: 'pull',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 40
  },
  {
    id: 30,
    name: 'T-Bar Row',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'machine',
    default_weight: 90
  },
  {
    id: 31,
    name: 'Face Pulls',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['back'],
    category: 'pull',
    is_compound: false,
    equipment: 'cable',
    default_weight: 50
  },
  {
    id: 32,
    name: 'Bicep Curls (Barbell)',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'barbell',
    default_weight: 40
  },
  {
    id: 33,
    name: 'Bicep Curls (Dumbbell)',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 20
  },
  {
    id: 34,
    name: 'Hammer Curls',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 20
  },
  {
    id: 35,
    name: 'Preacher Curls',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'machine',
    default_weight: 30
  },
  {
    id: 36,
    name: 'Shrugs (Dumbbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['back'],
    category: 'pull',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 50
  },
  {
    id: 37,
    name: 'Shrugs (Barbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['back'],
    category: 'pull',
    is_compound: false,
    equipment: 'barbell',
    default_weight: 135
  },
  {
    id: 38,
    name: 'Upright Rows',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['back'],
    category: 'pull',
    is_compound: false,
    equipment: 'barbell',
    default_weight: 65
  },

  // Leg Exercises
  {
    id: 40,
    name: 'Squat (Back)',
    primary_muscles: ['quadriceps', 'glutes'],
    secondary_muscles: ['hamstrings', 'core'],
    category: 'legs',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 185
  },
  {
    id: 41,
    name: 'Squat (Front)',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['glutes', 'core'],
    category: 'legs',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 135
  },
  {
    id: 42,
    name: 'Leg Press',
    primary_muscles: ['quadriceps', 'glutes'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: true,
    equipment: 'machine',
    default_weight: 180
  },
  {
    id: 43,
    name: 'Romanian Deadlift',
    primary_muscles: ['hamstrings', 'glutes'],
    secondary_muscles: ['back'],
    category: 'legs',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 185
  },
  {
    id: 44,
    name: 'Lunges (Bodyweight)',
    primary_muscles: ['quadriceps', 'glutes'],
    secondary_muscles: ['hamstrings'],
    category: 'legs',
    is_compound: true,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 45,
    name: 'Lunges (Dumbbell)',
    primary_muscles: ['quadriceps', 'glutes'],
    secondary_muscles: ['hamstrings'],
    category: 'legs',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 30
  },
  {
    id: 46,
    name: 'Bulgarian Split Squat',
    primary_muscles: ['quadriceps', 'glutes'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: true,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 47,
    name: 'Leg Extension',
    primary_muscles: ['quadriceps'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: false,
    equipment: 'machine',
    default_weight: 80
  },
  {
    id: 48,
    name: 'Leg Curl (Seated)',
    primary_muscles: ['hamstrings'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: false,
    equipment: 'machine',
    default_weight: 60
  },
  {
    id: 49,
    name: 'Leg Curl (Lying)',
    primary_muscles: ['hamstrings'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: false,
    equipment: 'machine',
    default_weight: 50
  },
  {
    id: 50,
    name: 'Calf Raises (Standing)',
    primary_muscles: ['calves'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 51,
    name: 'Calf Raises (Seated)',
    primary_muscles: ['calves'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: false,
    equipment: 'machine',
    default_weight: 50
  },
  {
    id: 52,
    name: 'Hip Thrust',
    primary_muscles: ['glutes'],
    secondary_muscles: ['hamstrings'],
    category: 'legs',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 135
  },
  {
    id: 53,
    name: 'Glute Bridge',
    primary_muscles: ['glutes'],
    secondary_muscles: ['hamstrings'],
    category: 'legs',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  },

  // Core Exercises
  {
    id: 60,
    name: 'Plank',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 61,
    name: 'Hanging Leg Raise',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 62,
    name: 'Knee Raises',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 63,
    name: 'Cable Crunch',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'cable',
    default_weight: 50
  },
  {
    id: 64,
    name: 'Ab Wheel Rollout',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'other',
    default_weight: 0
  },
  {
    id: 65,
    name: 'Russian Twists',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 66,
    name: 'Cable Woodchoppers',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'cable',
    default_weight: 30
  },
  {
    id: 67,
    name: 'Hanging Knee Raises',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 68,
    name: 'Bicycle Crunches',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 69,
    name: 'Dragon Flags',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  }
] as const;

export type PredefinedExercise = typeof PREDEFINED_EXERCISES[number];
