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
  // Push Exercises - Chest
  {
    id: 1,
    name: 'Bench Press (Barbell)',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 135
  },
  {
    id: 2,
    name: 'Bench Press (Dumbbell)',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 50
  },
  {
    id: 3,
    name: 'Incline Bench Press (Barbell)',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 115
  },
  {
    id: 4,
    name: 'Incline Bench Press (Dumbbell)',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 45
  },
  {
    id: 5,
    name: 'Decline Bench Press (Barbell)',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps'],
    category: 'push',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 135
  },
  {
    id: 6,
    name: 'Decline Bench Press (Dumbbell)',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps'],
    category: 'push',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 50
  },
  {
    id: 7,
    name: 'Dips',
    primary_muscles: ['triceps'],
    secondary_muscles: ['chest', 'shoulders'],
    category: 'push',
    is_compound: true,
    equipment: 'bodyweight',
    default_weight: 0
  },
  // Push Exercises - Triceps
  {
    id: 8,
    name: 'Tricep Pushdown (Rope)',
    primary_muscles: ['triceps'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 50
  },
  {
    id: 9,
    name: 'Tricep Pushdown (Straight Bar)',
    primary_muscles: ['triceps'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 40
  },
  {
    id: 10,
    name: 'Tricep Pushdown (V-Bar)',
    primary_muscles: ['triceps'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 45
  },
  {
    id: 11,
    name: 'Tricep Pushdown (Single Arm)',
    primary_muscles: ['triceps'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 20
  },
  {
    id: 12,
    name: 'Skull Crushers',
    primary_muscles: ['triceps'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'barbell',
    default_weight: 30
  },
  // Push Exercises - Shoulders
  {
    id: 13,
    name: 'Shoulder Press (Barbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['triceps'],
    category: 'push',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 95
  },
  {
    id: 14,
    name: 'Shoulder Press (Dumbbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['triceps'],
    category: 'push',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 40
  },
  {
    id: 15,
    name: 'Lateral Raise (Dumbbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 15
  },
  {
    id: 16,
    name: 'Lateral Raise (Cable)',
    primary_muscles: ['shoulders'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 15
  },
  {
    id: 17,
    name: 'Front Raise (Dumbbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 15
  },
  {
    id: 18,
    name: 'Rear Delt Fly (Machine)',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['back'],
    category: 'push',
    is_compound: false,
    equipment: 'machine',
    default_weight: 40
  },
  // Push Exercises - Chest Isolation
  {
    id: 19,
    name: 'Cable Fly (Low to High)',
    primary_muscles: ['chest'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 20
  },
  {
    id: 70,
    name: 'Cable Fly (High to Low)',
    primary_muscles: ['chest'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'cable',
    default_weight: 20
  },
  {
    id: 71,
    name: 'Pec Deck',
    primary_muscles: ['chest'],
    secondary_muscles: [],
    category: 'push',
    is_compound: false,
    equipment: 'machine',
    default_weight: 50
  },

  // Pull Exercises - Back Compound
  {
    id: 20,
    name: 'Deadlift (Conventional)',
    primary_muscles: ['back', 'hamstrings'],
    secondary_muscles: ['glutes', 'core'],
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
    name: 'Pull-ups',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 24,
    name: 'Chin-ups',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 25,
    name: 'Lat Pulldown (Wide)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'machine',
    default_weight: 80
  },
  {
    id: 26,
    name: 'Lat Pulldown (Close)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'machine',
    default_weight: 70
  },
  {
    id: 27,
    name: 'Seated Cable Row (Neutral)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'cable',
    default_weight: 80
  },
  {
    id: 28,
    name: 'Seated Cable Row (Wide)',
    primary_muscles: ['back'],
    secondary_muscles: ['biceps'],
    category: 'pull',
    is_compound: true,
    equipment: 'cable',
    default_weight: 70
  },
  {
    id: 29,
    name: 'Dumbbell Row',
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
  // Pull Exercises - Biceps
  {
    id: 32,
    name: 'Barbell Curl',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'barbell',
    default_weight: 40
  },
  {
    id: 33,
    name: 'Dumbbell Curl',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 20
  },
  {
    id: 34,
    name: 'Hammer Curl',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 20
  },
  {
    id: 35,
    name: 'Preacher Curl',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'machine',
    default_weight: 30
  },
  {
    id: 36,
    name: 'Incline Dumbbell Curl',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 15
  },
  {
    id: 37,
    name: 'Cable Curl',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
    category: 'pull',
    is_compound: false,
    equipment: 'cable',
    default_weight: 30
  },
  {
    id: 38,
    name: 'Shrugs (Dumbbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['back'],
    category: 'pull',
    is_compound: false,
    equipment: 'dumbbell',
    default_weight: 50
  },
  {
    id: 39,
    name: 'Shrugs (Barbell)',
    primary_muscles: ['shoulders'],
    secondary_muscles: ['back'],
    category: 'pull',
    is_compound: false,
    equipment: 'barbell',
    default_weight: 135
  },

  // Leg Exercises
  {
    id: 40,
    name: 'Back Squat',
    primary_muscles: ['quadriceps', 'glutes'],
    secondary_muscles: ['hamstrings', 'core'],
    category: 'legs',
    is_compound: true,
    equipment: 'barbell',
    default_weight: 185
  },
  {
    id: 41,
    name: 'Front Squat',
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
    name: 'Walking Lunges',
    primary_muscles: ['quadriceps', 'glutes'],
    secondary_muscles: ['hamstrings'],
    category: 'legs',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 30
  },
  {
    id: 45,
    name: 'Bulgarian Split Squat',
    primary_muscles: ['quadriceps', 'glutes'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: true,
    equipment: 'dumbbell',
    default_weight: 25
  },
  {
    id: 46,
    name: 'Hack Squat',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['glutes'],
    category: 'legs',
    is_compound: true,
    equipment: 'machine',
    default_weight: 90
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
    name: 'Calf Raise (Standing)',
    primary_muscles: ['calves'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: false,
    equipment: 'machine',
    default_weight: 100
  },
  {
    id: 51,
    name: 'Calf Raise (Seated)',
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
    name: 'Hip Adductor',
    primary_muscles: ['glutes'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: false,
    equipment: 'machine',
    default_weight: 80
  },
  {
    id: 54,
    name: 'Hip Abductor',
    primary_muscles: ['glutes'],
    secondary_muscles: [],
    category: 'legs',
    is_compound: false,
    equipment: 'machine',
    default_weight: 80
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
    name: 'Cable Crunch',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'cable',
    default_weight: 50
  },
  {
    id: 63,
    name: 'Ab Wheel Rollout',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'other',
    default_weight: 0
  },
  {
    id: 64,
    name: 'Russian Twist',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'bodyweight',
    default_weight: 0
  },
  {
    id: 65,
    name: 'Cable Woodchopper',
    primary_muscles: ['core'],
    secondary_muscles: [],
    category: 'core',
    is_compound: false,
    equipment: 'cable',
    default_weight: 30
  },
] as const;

export type PredefinedExercise = typeof PREDEFINED_EXERCISES[number];

// Workout types
export const WORKOUT_TYPES = ['Push', 'Pull', 'Chest/Back', 'Arms', 'Legs', 'Upper', 'Full', 'Core'] as const;
export type WorkoutType = typeof WORKOUT_TYPES[number];

// Curated exercise lists for each workout type (by exercise ID)
export const WORKOUT_TYPE_EXERCISES: Record<WorkoutType, number[]> = {
  'Push': [
    // Chest - Bench variations
    1, 2, 3, 4, 5, 6,
    // Dips
    7,
    // Triceps - Cable pushdowns
    8, 9, 10, 11,
    // Skull crushers
    12,
    // Shoulders
    13, 14, 15, 16,
  ],
  'Pull': [
    // Back compound
    20, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    // Back/Shoulder
    31, 38, 39,
    // Biceps
    32, 33, 34, 35, 36, 37,
  ],
  'Chest/Back': [
    // Chest
    1, 2, 3, 4, 5, 6, 7, 19, 70, 71,
    // Back
    22, 23, 24, 25, 26, 27, 28, 29, 30,
  ],
  'Arms': [
    // Triceps
    7, 8, 9, 10, 11, 12,
    // Biceps
    32, 33, 34, 35, 36, 37,
  ],
  'Legs': [
    // Quads/Compound
    40, 41, 42, 44, 45, 46, 47,
    // Hamstrings
    43, 48, 49,
    // Glutes
    52, 53, 54,
    // Calves
    50, 51,
  ],
  'Upper': [
    // Push - Chest
    1, 2, 3, 4,
    // Push - Shoulders
    13, 14, 15,
    // Push - Triceps
    8, 12,
    // Pull - Back
    22, 25, 27, 29,
    // Pull - Biceps
    32, 33, 34,
  ],
  'Full': [
    // Compound movements
    1, 3, 13, 20, 22, 25, 40, 42, 43,
    // Isolation
    8, 15, 32, 47, 48,
  ],
  'Core': [
    60, 61, 62, 63, 64, 65,
  ],
};

// Helper function to get exercises for a workout type
export function getExercisesForWorkoutType(workoutType: WorkoutType): PredefinedExercise[] {
  const exerciseIds = WORKOUT_TYPE_EXERCISES[workoutType] || [];
  return PREDEFINED_EXERCISES.filter(ex => exerciseIds.includes(ex.id));
}

// Featured exercises to display PRs for
export const FEATURED_PR_EXERCISES = [
  1,  // Bench Press (Barbell)
  2,  // Bench Press (Dumbbell)
  40, // Back Squat
  33, // Dumbbell Curl
  27, // Seated Cable Row (Neutral)
] as const;
