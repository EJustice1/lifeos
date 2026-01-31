'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task, LifeGoal, Project } from '@/types/database'
import { getTodayLocal } from '@/lib/utils/review-date'

// ===================================================================
// TASK CRUD OPERATIONS
// ===================================================================

export async function getTasks(filter?: {
  status?: Task['status']
  scheduled_date?: string
  project_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (filter?.status) {
    query = query.eq('status', filter.status)
  }
  if (filter?.scheduled_date) {
    query = query.eq('scheduled_date', filter.scheduled_date)
  }
  if (filter?.project_id) {
    query = query.eq('project_id', filter.project_id)
  }

  const { data } = await query
  return data ?? []
}

export async function getTaskById(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  return data
}

export async function getTodayTasks() {
  const today = getTodayLocal()
  return getTasks({ status: 'today', scheduled_date: today })
}

// Inbox has been removed - tasks go directly to backlog

export async function getBacklogTasks() {
  return getTasks({ status: 'backlog' })
}

export async function getIncompleteTasks(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('scheduled_date', date)
    .in('status', ['today', 'in_progress'])
    .is('completed_at', null)
    .order('position_in_day', { ascending: true, nullsFirst: false })
    .order('scheduled_time', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  return data ?? []
}

export async function createTask(data: {
  title: string
  description?: string
  status?: Task['status']
  project_id?: string
  scheduled_date?: string
  scheduled_time?: string
  duration_minutes?: number
  priority?: number
  tags?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      status: data.status || 'backlog',
      project_id: data.project_id,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      duration_minutes: data.duration_minutes,
      priority: data.priority || 3,
      tags: data.tags || [],
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/strategy')
  return task
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string
    description?: string | null
    status?: Task['status']
    project_id?: string | null
    scheduled_date?: string | null
    scheduled_time?: string | null
    duration_minutes?: number | null
    priority?: number | null
    tags?: string[]
    gcal_event_id?: string | null
    gcal_sync_status?: Task['gcal_sync_status']
    position_in_day?: number | null
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/strategy')
  return data
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/strategy')
}

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/strategy')
  return data
}

export async function uncompleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'today',
      completed_at: null,
    })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/strategy')
  return data
}

// ===================================================================
// TASK STATUS TRANSITIONS
// ===================================================================

export async function promoteToToday(taskId: string) {
  const today = getTodayLocal()

  return updateTask(taskId, {
    status: 'today',
    scheduled_date: today,
  })
}

export async function moveToBacklog(taskId: string) {
  return updateTask(taskId, {
    status: 'backlog',
    scheduled_date: null,
    scheduled_time: null,
  })
}

export async function moveTaskToDate(taskId: string, date: string) {
  return updateTask(taskId, {
    scheduled_date: date,
    status: 'today',
  })
}

export async function scheduleTask(
  taskId: string,
  date: string,
  time?: string,
  durationMinutes?: number
) {
  return updateTask(taskId, {
    scheduled_date: date,
    scheduled_time: time,
    duration_minutes: durationMinutes,
    status: 'today',
  })
}

// ===================================================================
// LIFE GOALS CRUD OPERATIONS
// ===================================================================

export async function getLifeGoals(includeArchived = false) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('life_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!includeArchived) {
    query = query.eq('archived', false)
  }

  const { data } = await query
  return data ?? []
}

export async function getLifeGoalById(goalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('life_goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  return data
}

export async function createLifeGoal(data: {
  title: string
  description?: string
  category?: LifeGoal['category']
  target_date?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: goal, error } = await supabase
    .from('life_goals')
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      target_date: data.target_date,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/strategy')
  return goal
}

export async function updateLifeGoal(
  goalId: string,
  updates: {
    title?: string
    description?: string | null
    category?: LifeGoal['category']
    status?: LifeGoal['status']
    target_date?: string | null
    archived?: boolean
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('life_goals')
    .update(updates)
    .eq('id', goalId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/strategy')
  return data
}

export async function deleteLifeGoal(goalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('life_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/strategy')
}

// ===================================================================
// PROJECTS CRUD OPERATIONS
// ===================================================================

export async function getProjects(lifeGoalId?: string, includeArchived = false) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (lifeGoalId) {
    query = query.eq('life_goal_id', lifeGoalId)
  }

  if (!includeArchived) {
    query = query.eq('archived', false)
  }

  const { data } = await query
  return data ?? []
}

export async function getProjectById(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  return data
}

export async function createProject(data: {
  title: string
  description?: string
  life_goal_id?: string
  color?: string
  type?: 'class' | 'lab' | 'project' | 'work' | 'other'
  target_date?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      life_goal_id: data.life_goal_id,
      color: data.color || '#3b82f6',
      type: data.type,
      target_date: data.target_date,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/strategy')
  revalidatePath('/m/study')
  return project
}

export async function updateProject(
  projectId: string,
  updates: {
    title?: string
    description?: string | null
    life_goal_id?: string | null
    color?: string
    type?: 'class' | 'lab' | 'project' | 'work' | 'other' | null
    status?: Project['status']
    target_date?: string | null
    completed_at?: string | null
    archived?: boolean
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/strategy')
  revalidatePath('/m/study')
  return data
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/strategy')
  revalidatePath('/m/study')
}

export async function archiveProject(projectId: string) {
  return updateProject(projectId, { archived: true, status: 'archived' })
}

export async function unarchiveProject(projectId: string) {
  return updateProject(projectId, { archived: false, status: 'active' })
}

// ===================================================================
// TASK COMPLETION FEEDBACK
// ===================================================================

export async function saveTaskFeedback(data: {
  task_id?: string
  session_id?: string
  session_type: 'study' | 'workout' | 'task'
  effort_rating?: number
  focus_rating?: number
  failure_tags?: string[]
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: feedback, error } = await supabase
    .from('task_completion_feedback')
    .insert({
      user_id: user.id,
      task_id: data.task_id,
      session_id: data.session_id,
      session_type: data.session_type,
      effort_rating: data.effort_rating,
      focus_rating: data.focus_rating,
      failure_tags: data.failure_tags || [],
      notes: data.notes,
    })
    .select()
    .single()

  if (error) throw error

  return feedback
}

// ===================================================================
// BULK OPERATIONS
// ===================================================================

export async function bulkUpdateTaskStatus(
  taskIds: string[],
  status: Task['status'],
  scheduled_date?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates: any = { status }
  if (scheduled_date !== undefined) {
    updates.scheduled_date = scheduled_date
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .in('id', taskIds)
    .eq('user_id', user.id)
    .select()

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/strategy')
  return data
}

export async function bulkDeleteTasks(taskIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .delete()
    .in('id', taskIds)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/strategy')
}

// ===================================================================
// AUTOMATIC TASK ROLLOVER
// ===================================================================

export interface AutomaticRolloverResult {
  success: boolean
  tasksMovedCount: number
  tasksMoved: string[]
  alreadyExecuted: boolean
}

/**
 * Executes automatic task rollover for incomplete tasks from previous days.
 * This function is idempotent - it will only execute once per review date.
 *
 * Tasks that are automatically moved to backlog:
 * - Tasks with status='today' AND scheduled_date < reviewDate
 * - Tasks with status='in_progress' AND scheduled_date < reviewDate
 * - Tasks with scheduled_date = yesterday AND status != 'completed'
 */
export async function executeAutomaticTaskRollover(reviewDate: string): Promise<AutomaticRolloverResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  try {
    // Check if rollover already executed for this date (idempotency check)
    const { data: rolloverState } = await supabase
      .from('task_rollover_state')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (rolloverState && rolloverState.last_rollover_date === reviewDate) {
      // Already executed for this date
      return {
        success: true,
        tasksMovedCount: 0,
        tasksMoved: [],
        alreadyExecuted: true,
      }
    }

    // Calculate yesterday's date
    const reviewDateObj = new Date(reviewDate)
    const yesterday = new Date(reviewDateObj)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Find all tasks that need to be moved to backlog
    const { data: tasksToRollover } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .or(`and(status.eq.today,scheduled_date.lt.${reviewDate}),and(status.eq.in_progress,scheduled_date.lt.${reviewDate}),and(scheduled_date.eq.${yesterdayStr},status.neq.completed,status.neq.cancelled)`)

    if (!tasksToRollover || tasksToRollover.length === 0) {
      // No tasks to rollover, but mark as executed
      await supabase
        .from('task_rollover_state')
        .upsert({
          user_id: user.id,
          last_rollover_date: reviewDate,
          last_rollover_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })

      return {
        success: true,
        tasksMovedCount: 0,
        tasksMoved: [],
        alreadyExecuted: false,
      }
    }

    const taskIds = tasksToRollover.map(t => t.id)

    // Move tasks to backlog (bulk update)
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'backlog',
        scheduled_date: null,
        scheduled_time: null,
      })
      .in('id', taskIds)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    // Insert audit log entry
    await supabase
      .from('task_rollover_log')
      .insert({
        user_id: user.id,
        rollover_date: reviewDate,
        tasks_moved: taskIds,
        executed_at: new Date().toISOString(),
      })

    // Update rollover state
    await supabase
      .from('task_rollover_state')
      .upsert({
        user_id: user.id,
        last_rollover_date: reviewDate,
        last_rollover_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    // Revalidate paths
    revalidatePath('/')
    revalidatePath('/m/daily-context-review')

    return {
      success: true,
      tasksMovedCount: taskIds.length,
      tasksMoved: taskIds,
      alreadyExecuted: false,
    }
  } catch (error) {
    console.error('Automatic task rollover failed:', error)
    throw error
  }
}

export interface UndoRolloverResult {
  success: boolean
  tasksRestored: number
}

/**
 * Undoes the last automatic task rollover if within the 5-minute window.
 * Restores tasks to their previous state.
 */
export async function undoLastTaskRollover(): Promise<UndoRolloverResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  try {
    // Get the latest rollover log entry
    const { data: latestLog } = await supabase
      .from('task_rollover_log')
      .select('*')
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false })
      .limit(1)
      .single()

    if (!latestLog) {
      throw new Error('No rollover log found')
    }

    // Check if within 5-minute undo window
    const executedAt = new Date(latestLog.executed_at)
    const now = new Date()
    const minutesSinceExecution = (now.getTime() - executedAt.getTime()) / (1000 * 60)

    if (minutesSinceExecution > 5) {
      throw new Error('Undo window expired (5 minutes)')
    }

    // Calculate yesterday from the rollover date
    const rolloverDateObj = new Date(latestLog.rollover_date)
    const yesterday = new Date(rolloverDateObj)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Restore tasks to their previous state
    const { error: restoreError } = await supabase
      .from('tasks')
      .update({
        status: 'today',
        scheduled_date: yesterdayStr,
      })
      .in('id', latestLog.tasks_moved)
      .eq('user_id', user.id)

    if (restoreError) throw restoreError

    // Delete the log entry
    await supabase
      .from('task_rollover_log')
      .delete()
      .eq('id', latestLog.id)
      .eq('user_id', user.id)

    // Update rollover state (revert to previous date)
    const rolloverDateObj2 = new Date(latestLog.rollover_date)
    const dayBeforeRollover = new Date(rolloverDateObj2)
    dayBeforeRollover.setDate(dayBeforeRollover.getDate() - 1)
    const dayBeforeRolloverStr = dayBeforeRollover.toISOString().split('T')[0]

    await supabase
      .from('task_rollover_state')
      .update({
        last_rollover_date: dayBeforeRolloverStr,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    // Revalidate paths
    revalidatePath('/')
    revalidatePath('/m/daily-context-review')

    return {
      success: true,
      tasksRestored: latestLog.tasks_moved.length,
    }
  } catch (error) {
    console.error('Undo rollover failed:', error)
    throw error
  }
}
