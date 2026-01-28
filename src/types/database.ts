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
          effort_rating: number | null
          feeling_rating: number | null
          failure_tags: string[]
          task_id: string | null
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
          effort_rating?: number | null
          feeling_rating?: number | null
          failure_tags?: string[]
          task_id?: string | null
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
          effort_rating?: number | null
          feeling_rating?: number | null
          failure_tags?: string[]
          task_id?: string | null
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
          project_id: string | null
          bucket_id: string | null // DEPRECATED: kept for migration reference
          date: string
          started_at: string
          ended_at: string | null
          duration_minutes: number
          notes: string | null
          effort_rating: number | null
          focus_rating: number | null
          failure_tags: string[]
          task_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          bucket_id?: string | null // DEPRECATED
          date: string
          started_at: string
          ended_at?: string | null
          duration_minutes?: number
          notes?: string | null
          effort_rating?: number | null
          focus_rating?: number | null
          failure_tags?: string[]
          task_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          bucket_id?: string | null // DEPRECATED
          date?: string
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number
          notes?: string | null
          effort_rating?: number | null
          focus_rating?: number | null
          failure_tags?: string[]
          task_id?: string | null
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
          unfocused_factors: string[]
          lesson_learned: string | null
          highlights: string | null
          tomorrow_goals: string[]
          yesterday_goals: string[]
          screen_time_minutes: number | null
          execution_score_suggested: number | null
          execution_score_locked: boolean
          incomplete_tasks_processed: boolean
          rolled_over_task_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          execution_score: number
          unfocused_factors?: string[]
          lesson_learned?: string | null
          highlights?: string | null
          tomorrow_goals?: string[]
          yesterday_goals?: string[]
          screen_time_minutes?: number | null
          execution_score_suggested?: number | null
          execution_score_locked?: boolean
          incomplete_tasks_processed?: boolean
          rolled_over_task_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          execution_score?: number
          unfocused_factors?: string[]
          lesson_learned?: string | null
          highlights?: string | null
          tomorrow_goals?: string[]
          yesterday_goals?: string[]
          screen_time_minutes?: number | null
          execution_score_suggested?: number | null
          execution_score_locked?: boolean
          incomplete_tasks_processed?: boolean
          rolled_over_task_ids?: string[]
          created_at?: string
        }
      }

      // Task Management: Life Goals (top-level hierarchy)
      life_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: 'health' | 'career' | 'relationships' | 'finance' | 'personal' | 'other' | null
          status: 'active' | 'completed' | 'abandoned'
          target_date: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
          archived: boolean
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: 'health' | 'career' | 'relationships' | 'finance' | 'personal' | 'other' | null
          status?: 'active' | 'completed' | 'abandoned'
          target_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          archived?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: 'health' | 'career' | 'relationships' | 'finance' | 'personal' | 'other' | null
          status?: 'active' | 'completed' | 'abandoned'
          target_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          archived?: boolean
        }
      }

      // Task Management: Projects (middle hierarchy level)
      projects: {
        Row: {
          id: string
          user_id: string
          life_goal_id: string | null
          title: string
          description: string | null
          color: string
          type: 'class' | 'lab' | 'project' | 'work' | 'other' | null
          status: 'active' | 'completed' | 'on_hold' | 'archived'
          target_date: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
          archived: boolean
        }
        Insert: {
          id?: string
          user_id: string
          life_goal_id?: string | null
          title: string
          description?: string | null
          color?: string
          type?: 'class' | 'lab' | 'project' | 'work' | 'other' | null
          status?: 'active' | 'completed' | 'on_hold' | 'archived'
          target_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          archived?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          life_goal_id?: string | null
          title?: string
          description?: string | null
          color?: string
          type?: 'class' | 'lab' | 'project' | 'work' | 'other' | null
          status?: 'active' | 'completed' | 'on_hold' | 'archived'
          target_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          archived?: boolean
        }
      }

      // Task Management: Tasks (actionable items)
      tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          description: string | null
          status: 'backlog' | 'today' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_date: string | null
          scheduled_time: string | null
          duration_minutes: number | null
          linked_domain: 'gym' | 'study' | null
          gcal_event_id: string | null
          gcal_sync_status: 'synced' | 'pending' | 'conflict' | 'error' | null
          gcal_last_sync: string | null
          priority: number
          tags: string[]
          created_at: string
          updated_at: string
          completed_at: string | null
          promoted_to_today_at: string | null
          position_in_day: number | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          description?: string | null
          status?: 'backlog' | 'today' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_date?: string | null
          scheduled_time?: string | null
          duration_minutes?: number | null
          linked_domain?: 'gym' | 'study' | null
          gcal_event_id?: string | null
          gcal_sync_status?: 'synced' | 'pending' | 'conflict' | 'error' | null
          gcal_last_sync?: string | null
          priority?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          promoted_to_today_at?: string | null
          position_in_day?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          title?: string
          description?: string | null
          status?: 'backlog' | 'today' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_date?: string | null
          scheduled_time?: string | null
          duration_minutes?: number | null
          linked_domain?: 'gym' | 'study' | null
          gcal_event_id?: string | null
          gcal_sync_status?: 'synced' | 'pending' | 'conflict' | 'error' | null
          gcal_last_sync?: string | null
          priority?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          promoted_to_today_at?: string | null
          position_in_day?: number | null
        }
      }

      // Task Completion Feedback (Active Cooldown data)

      // Task Completion Feedback (Active Cooldown data)
      task_completion_feedback: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          session_id: string | null
          session_type: 'study' | 'workout' | 'task'
          effort_rating: number | null
          focus_rating: number | null
          failure_tags: string[]
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          session_id?: string | null
          session_type: 'study' | 'workout' | 'task'
          effort_rating?: number | null
          focus_rating?: number | null
          failure_tags?: string[]
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          session_id?: string | null
          session_type?: 'study' | 'workout' | 'task'
          effort_rating?: number | null
          focus_rating?: number | null
          failure_tags?: string[]
          notes?: string | null
          created_at?: string
        }
      }

      // Google Calendar: Events cache
      google_calendar_events: {
        Row: {
          id: string
          user_id: string
          gcal_event_id: string
          calendar_id: string
          summary: string
          description: string | null
          start_time: string
          end_time: string
          all_day: boolean
          location: string | null
          task_id: string | null
          last_synced: string
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gcal_event_id: string
          calendar_id: string
          summary: string
          description?: string | null
          start_time: string
          end_time: string
          all_day?: boolean
          location?: string | null
          task_id?: string | null
          last_synced?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gcal_event_id?: string
          calendar_id?: string
          summary?: string
          description?: string | null
          start_time?: string
          end_time?: string
          all_day?: boolean
          location?: string | null
          task_id?: string | null
          last_synced?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // Google Calendar: Credentials
      google_calendar_credentials: {
        Row: {
          user_id: string
          access_token: string
          refresh_token: string
          token_expiry: string
          calendar_id: string | null
          last_sync: string | null
          sync_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          access_token: string
          refresh_token: string
          token_expiry: string
          calendar_id?: string | null
          last_sync?: string | null
          sync_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          access_token?: string
          refresh_token?: string
          token_expiry?: string
          calendar_id?: string | null
          last_sync?: string | null
          sync_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // Migration tracking
      migration_status: {
        Row: {
          user_id: string
          buckets_migrated: boolean
          goals_migrated: boolean
          migration_started_at: string | null
          migration_completed_at: string | null
        }
        Insert: {
          user_id: string
          buckets_migrated?: boolean
          goals_migrated?: boolean
          migration_started_at?: string | null
          migration_completed_at?: string | null
        }
        Update: {
          user_id?: string
          buckets_migrated?: boolean
          goals_migrated?: boolean
          migration_started_at?: string | null
          migration_completed_at?: string | null
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

// Task Management types
export type LifeGoal = Database['public']['Tables']['life_goals']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskCompletionFeedback = Database['public']['Tables']['task_completion_feedback']['Row']
export type GoogleCalendarEvent = Database['public']['Tables']['google_calendar_events']['Row']
export type GoogleCalendarCredentials = Database['public']['Tables']['google_calendar_credentials']['Row']
export type MigrationStatus = Database['public']['Tables']['migration_status']['Row']
