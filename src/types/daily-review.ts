export interface DailyContextData {
  date: string
  studyHours: number
  studyMinutes: number
  workoutsCompleted: number
  workoutsTotal: number
  screenTimeHours: number
  screenTimeMinutes: number
}

export interface DailyReviewRow {
  id: string
  user_id: string
  date: string
  execution_score: number
  unfocused_factors: string[]
  lesson_learned: string | null
  highlights: string | null
  tomorrow_goals?: string[]
  yesterday_goals?: string[]
  created_at: string
  screen_time_minutes?: number
  execution_score_suggested?: number
  execution_score_locked?: boolean
}
