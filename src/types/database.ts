export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // User profile extending Supabase auth
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          display_name: string | null
          timezone: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          timezone?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          timezone?: string
        }
      }


      // Gym: Lifts (replaces workout_sets)
      lifts: {
        Row: {
          id: string
          user_id: string
          exercise_id: number // References predefined exercise ID
          workout_id: string
          weight: number
          reps: number
          rpe: number | null
          set_number: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: number
          workout_id: string
          weight: number
          reps: number
          rpe?: number | null
          set_number: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: number
          workout_id?: string
          weight?: number
          reps?: number
          rpe?: number | null
          set_number?: number
          created_at?: string
        }
      }

      // Gym: Personal Records
      personal_records: {
        Row: {
          id: string
          user_id: string
          exercise_id: number // References predefined exercise ID
          weight: number
          reps: number
          estimated_1rm: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: number
          weight: number
          reps: number
          estimated_1rm: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: number
          weight?: number
          reps?: number
          estimated_1rm?: number
          date?: string
          created_at?: string
        }
      }

      // Gym: Workouts
      workouts: {
        Row: {
          id: string
          user_id: string
          date: string
          started_at: string
          ended_at: string | null
          type: string | null
          notes: string | null
          total_volume: number
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          started_at: string
          ended_at?: string | null
          type?: string | null
          notes?: string | null
          total_volume?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          started_at?: string
          ended_at?: string | null
          type?: string | null
          notes?: string | null
          total_volume?: number
        }
      }



      // Career: Study/work buckets
      buckets: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'class' | 'lab' | 'project' | 'work' | 'other'
          color: string
          is_archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'class' | 'lab' | 'project' | 'work' | 'other'
          color?: string
          is_archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'class' | 'lab' | 'project' | 'work' | 'other'
          color?: string
          is_archived?: boolean
          created_at?: string
        }
      }

      // Career: Study sessions
      study_sessions: {
        Row: {
          id: string
          user_id: string
          bucket_id: string
          date: string
          started_at: string
          ended_at: string | null
          duration_minutes: number
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          bucket_id: string
          date: string
          started_at: string
          ended_at?: string | null
          duration_minutes?: number
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          bucket_id?: string
          date?: string
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number
          notes?: string | null
        }
      }

      // Digital: Screen time records
      screen_time: {
        Row: {
          id: string
          user_id: string
          date: string
          productive_minutes: number
          distracted_minutes: number
          mobile_minutes: number
          desktop_minutes: number
          source: 'rescuetime' | 'manual'
          synced_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          productive_minutes?: number
          distracted_minutes?: number
          mobile_minutes?: number
          desktop_minutes?: number
          source?: 'rescuetime' | 'manual'
          synced_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          productive_minutes?: number
          distracted_minutes?: number
          mobile_minutes?: number
          desktop_minutes?: number
          source?: 'rescuetime' | 'manual'
          synced_at?: string
        }
      }

      // Digital: App usage breakdown
      app_usage: {
        Row: {
          id: string
          user_id: string
          date: string
          app_name: string
          category: 'productive' | 'neutral' | 'distracted'
          minutes: number
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          app_name: string
          category: 'productive' | 'neutral' | 'distracted'
          minutes: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          app_name?: string
          category?: 'productive' | 'neutral' | 'distracted'
          minutes?: number
        }
      }

      // Daily reviews
      daily_reviews: {
        Row: {
          id: string
          user_id: string
          date: string
          mood: number
          energy: number
          perceived_success: number
          wins: string | null
          improvements: string | null
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          mood: number
          energy: number
          perceived_success: number
          wins?: string | null
          improvements?: string | null
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          mood?: number
          energy?: number
          perceived_success?: number
          wins?: string | null
          improvements?: string | null
          tags?: string[]
          created_at?: string
        }
      },

      // Gym progress tracking tables
      gym_progress_history: {
        Row: {
          id: string
          user_id: string
          exercise_id: number
          date: string
          one_rep_max: number
          estimated_from_reps: number | null
          estimated_from_weight: number | null
          workout_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: number
          date: string
          one_rep_max: number
          estimated_from_reps?: number | null
          estimated_from_weight?: number | null
          workout_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: number
          date?: string
          one_rep_max?: number
          estimated_from_reps?: number | null
          estimated_from_weight?: number | null
          workout_id?: string | null
          created_at?: string
        }
      },

      gym_progress_snapshots: {
        Row: {
          id: string
          user_id: string
          date: string
          snapshot_data: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          snapshot_data: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          snapshot_data?: any
          created_at?: string
        }
      },

      gym_strength_standards: {
        Row: {
          id: string
          exercise_id: number
          gender: 'male' | 'female' | 'unisex'
          weight_class: 'light' | 'medium' | 'heavy'
          beginner: number
          intermediate: number
          advanced: number
          elite: number
          created_at: string
        }
        Insert: {
          id?: string
          exercise_id: number
          gender: 'male' | 'female' | 'unisex'
          weight_class: 'light' | 'medium' | 'heavy'
          beginner: number
          intermediate: number
          advanced: number
          elite: number
          created_at?: string
        }
        Update: {
          id?: string
          exercise_id?: number
          gender?: 'male' | 'female' | 'unisex'
          weight_class?: 'light' | 'medium' | 'heavy'
          beginner?: number
          intermediate?: number
          advanced?: number
          elite?: number
          created_at?: string
        }
      },

      // Daily context reviews
      daily_context_reviews: {
        Row: {
          id: string
          user_id: string
          date: string
          execution_score: number
          focus_quality: number
          physical_vitality: number
          unfocused_factors: string[]
          lesson_learned: string | null
          highlights: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          execution_score: number
          focus_quality: number
          physical_vitality: number
          unfocused_factors?: string[]
          lesson_learned?: string | null
          highlights?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          execution_score?: number
          focus_quality?: number
          physical_vitality?: number
          unfocused_factors?: string[]
          lesson_learned?: string | null
          highlights?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
// Exercise type removed - using predefined exercises instead
export type Workout = Database['public']['Tables']['workouts']['Row']
export type Lift = Database['public']['Tables']['lifts']['Row']
// WorkoutSet type removed - replaced with Lifts
export type PersonalRecord = Database['public']['Tables']['personal_records']['Row']
export type GymProgressHistory = Database['public']['Tables']['gym_progress_history']['Row']
export type GymProgressSnapshot = Database['public']['Tables']['gym_progress_snapshots']['Row']
export type GymStrengthStandard = Database['public']['Tables']['gym_strength_standards']['Row']
export type Bucket = Database['public']['Tables']['buckets']['Row']
export type StudySession = Database['public']['Tables']['study_sessions']['Row']
export type ScreenTime = Database['public']['Tables']['screen_time']['Row']
export type AppUsage = Database['public']['Tables']['app_usage']['Row']
export type DailyReview = Database['public']['Tables']['daily_reviews']['Row']
export type DailyContextReview = Database['public']['Tables']['daily_context_reviews']['Row']
