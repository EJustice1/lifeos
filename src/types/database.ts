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

      // Financial: Accounts (bank, investment, crypto, etc.)
      accounts: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          type: 'cash' | 'checking' | 'savings' | 'investment' | 'crypto' | 'other'
          balance: number
          currency: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          type: 'cash' | 'checking' | 'savings' | 'investment' | 'crypto' | 'other'
          balance?: number
          currency?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          type?: 'cash' | 'checking' | 'savings' | 'investment' | 'crypto' | 'other'
          balance?: number
          currency?: string
          is_active?: boolean
        }
      }

      // Financial: Transactions
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          created_at: string
          date: string
          type: 'income' | 'expense' | 'transfer'
          amount: number
          category: string
          description: string | null
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          created_at?: string
          date: string
          type: 'income' | 'expense' | 'transfer'
          amount: number
          category: string
          description?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          created_at?: string
          date?: string
          type?: 'income' | 'expense' | 'transfer'
          amount?: number
          category?: string
          description?: string | null
        }
      }

      // Financial: Net worth snapshots (daily/weekly tracking)
      net_worth_snapshots: {
        Row: {
          id: string
          user_id: string
          date: string
          total_assets: number
          total_cash: number
          total_investments: number
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          total_assets: number
          total_cash: number
          total_investments: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          total_assets?: number
          total_cash?: number
          total_investments?: number
        }
      }

      // Gym: Exercise definitions
      exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          category: 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'other'
          is_compound: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'other'
          is_compound?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'other'
          is_compound?: boolean
          created_at?: string
        }
      }

      // Gym: Workout sessions
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

      // Gym: Individual sets
      workout_sets: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          set_number: number
          reps: number
          weight: number
          rpe: number | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          set_number: number
          reps: number
          weight: number
          rpe?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          set_number?: number
          reps?: number
          weight?: number
          rpe?: number | null
          created_at?: string
        }
      }

      // Gym: Personal records
      personal_records: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          weight: number
          reps: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          weight: number
          reps: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          weight?: number
          reps?: number
          date?: string
          created_at?: string
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
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type NetWorthSnapshot = Database['public']['Tables']['net_worth_snapshots']['Row']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type Workout = Database['public']['Tables']['workouts']['Row']
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']
export type PersonalRecord = Database['public']['Tables']['personal_records']['Row']
export type Bucket = Database['public']['Tables']['buckets']['Row']
export type StudySession = Database['public']['Tables']['study_sessions']['Row']
export type ScreenTime = Database['public']['Tables']['screen_time']['Row']
export type AppUsage = Database['public']['Tables']['app_usage']['Row']
export type DailyReview = Database['public']['Tables']['daily_reviews']['Row']
