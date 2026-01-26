/**
 * Bidirectional Sync Between LifeOS Tasks and Google Calendar
 *
 * Sync strategy:
 * 1. Pull changes from Google Calendar
 * 2. Compare with local cache (google_calendar_events table)
 * 3. Apply changes to local database
 * 4. Push local changes to Google Calendar (tasks with gcal_sync_status = 'pending')
 * 5. Update sync timestamps
 */

import { createClient } from '@/lib/supabase/server'
import { createCalendarHandler, type GoogleCalendarEvent } from './GoogleCalendarHandler'
import type { Task } from '@/types/database'

export interface SyncResult {
  created: number
  updated: number
  deleted: number
  errors: Array<{ eventId?: string; taskId?: string; error: string }>
}

/**
 * Perform bidirectional sync between LifeOS and Google Calendar
 * @param userId User ID
 * @param startDate Start date for sync window
 * @param endDate End date for sync window
 * @returns Sync result statistics
 */
export async function syncGoogleCalendar(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<SyncResult> {
  const supabase = await createClient()
  const handler = createCalendarHandler(userId)

  const result: SyncResult = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
  }

  try {
    // Step 1: Pull changes from Google Calendar
    const googleEvents = await handler.listEvents(startDate, endDate)

    // Step 2: Get local cache
    const { data: localCache } = await supabase
      .from('google_calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())

    const localEventsMap = new Map(
      (localCache || []).map(event => [event.gcal_event_id, event])
    )

    // Step 3: Identify changes
    const toCreate: GoogleCalendarEvent[] = []
    const toUpdate: GoogleCalendarEvent[] = []

    for (const googleEvent of googleEvents) {
      const localEvent = localEventsMap.get(googleEvent.id)

      if (!localEvent) {
        // New event from Google Calendar
        toCreate.push(googleEvent)
      } else if (
        localEvent.is_deleted ||
        new Date(googleEvent.updated || 0) > new Date(localEvent.last_synced)
      ) {
        // Event was updated in Google Calendar
        toUpdate.push(googleEvent)
      }

      // Remove from map (remaining events are deleted in Google)
      localEventsMap.delete(googleEvent.id)
    }

    // Remaining events in map were deleted from Google Calendar
    const toDelete = Array.from(localEventsMap.values())

    // Step 4: Apply changes to local database
    for (const event of toCreate) {
      try {
        await createLocalEvent(userId, event)
        result.created++
      } catch (error) {
        result.errors.push({
          eventId: event.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    for (const event of toUpdate) {
      try {
        await updateLocalEvent(userId, event)
        result.updated++
      } catch (error) {
        result.errors.push({
          eventId: event.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    for (const event of toDelete) {
      try {
        await deleteLocalEvent(userId, event.gcal_event_id)
        result.deleted++
      } catch (error) {
        result.errors.push({
          eventId: event.gcal_event_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Step 5: Push local changes to Google Calendar
    const pushResult = await pushLocalChanges(userId, handler)
    result.created += pushResult.created
    result.updated += pushResult.updated
    result.errors.push(...pushResult.errors)

    // Step 6: Update last sync timestamp
    await supabase
      .from('google_calendar_credentials')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', userId)

    return result
  } catch (error) {
    console.error('Sync failed:', error)
    result.errors.push({
      error: error instanceof Error ? error.message : 'Sync failed',
    })
    return result
  }
}

/**
 * Create local event from Google Calendar event
 */
async function createLocalEvent(
  userId: string,
  googleEvent: GoogleCalendarEvent
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('google_calendar_events')
    .insert({
      user_id: userId,
      gcal_event_id: googleEvent.id,
      calendar_id: 'primary', // TODO: Get actual calendar ID
      summary: googleEvent.summary,
      description: googleEvent.description,
      start_time: googleEvent.start.dateTime || googleEvent.start.date || '',
      end_time: googleEvent.end.dateTime || googleEvent.end.date || '',
      all_day: !!googleEvent.start.date,
      location: googleEvent.location,
      last_synced: new Date().toISOString(),
      is_deleted: false,
    })

  if (error) {
    throw new Error(`Failed to create local event: ${error.message}`)
  }
}

/**
 * Update local event from Google Calendar event
 */
async function updateLocalEvent(
  userId: string,
  googleEvent: GoogleCalendarEvent
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('google_calendar_events')
    .update({
      summary: googleEvent.summary,
      description: googleEvent.description,
      start_time: googleEvent.start.dateTime || googleEvent.start.date || '',
      end_time: googleEvent.end.dateTime || googleEvent.end.date || '',
      all_day: !!googleEvent.start.date,
      location: googleEvent.location,
      last_synced: new Date().toISOString(),
      is_deleted: googleEvent.status === 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('gcal_event_id', googleEvent.id)

  if (error) {
    throw new Error(`Failed to update local event: ${error.message}`)
  }
}

/**
 * Mark local event as deleted
 */
async function deleteLocalEvent(userId: string, gcalEventId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('google_calendar_events')
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('gcal_event_id', gcalEventId)

  if (error) {
    throw new Error(`Failed to delete local event: ${error.message}`)
  }
}

/**
 * Push local changes to Google Calendar
 */
async function pushLocalChanges(
  userId: string,
  handler: ReturnType<typeof createCalendarHandler>
): Promise<{
  created: number
  updated: number
  errors: Array<{ taskId?: string; error: string }>
}> {
  const supabase = await createClient()
  const result = { created: 0, updated: 0, errors: [] as any[] }

  // Get tasks that need syncing
  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('gcal_sync_status', 'pending')

  if (!pendingTasks || pendingTasks.length === 0) {
    return result
  }

  for (const task of pendingTasks) {
    try {
      if (!task.gcal_event_id) {
        // Create new event
        const event = await handler.createEvent(taskToGoogleEvent(task))

        // Update task with event ID
        await supabase
          .from('tasks')
          .update({
            gcal_event_id: event.id,
            gcal_sync_status: 'synced',
            gcal_last_sync: new Date().toISOString(),
          })
          .eq('id', task.id)

        // Create local cache entry
        await createLocalEvent(userId, event)

        result.created++
      } else {
        // Update existing event
        await handler.updateEvent(task.gcal_event_id, taskToGoogleEvent(task))

        // Update task sync status
        await supabase
          .from('tasks')
          .update({
            gcal_sync_status: 'synced',
            gcal_last_sync: new Date().toISOString(),
          })
          .eq('id', task.id)

        result.updated++
      }
    } catch (error) {
      // Mark task as error
      await supabase
        .from('tasks')
        .update({ gcal_sync_status: 'error' })
        .eq('id', task.id)

      result.errors.push({
        taskId: task.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}

/**
 * Convert LifeOS task to Google Calendar event format
 */
function taskToGoogleEvent(task: Task): {
  summary: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  location?: string
} {
  const timeZone = 'America/New_York' // TODO: Get from user profile

  // If task has specific time, use dateTime
  if (task.scheduled_time && task.scheduled_date) {
    const startDateTime = `${task.scheduled_date}T${task.scheduled_time}`
    const durationMinutes = task.duration_minutes || 60

    const endDateTime = new Date(
      new Date(startDateTime).getTime() + durationMinutes * 60 * 1000
    ).toISOString()

    return {
      summary: task.title,
      description: task.description || undefined,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
    }
  }

  // Otherwise, use all-day event
  if (task.scheduled_date) {
    return {
      summary: task.title,
      description: task.description || undefined,
      start: {
        date: task.scheduled_date,
      },
      end: {
        date: task.scheduled_date,
      },
    }
  }

  // Fallback: create event for today
  const today = new Date().toISOString().split('T')[0]
  return {
    summary: task.title,
    description: task.description || undefined,
    start: {
      date: today,
    },
    end: {
      date: today,
    },
  }
}

/**
 * Get sync status for user
 */
export async function getSyncStatus(userId: string): Promise<{
  last_sync: Date | null
  sync_enabled: boolean
  connected: boolean
}> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('google_calendar_credentials')
    .select('last_sync, sync_enabled')
    .eq('user_id', userId)
    .single()

  if (!data) {
    return {
      last_sync: null,
      sync_enabled: false,
      connected: false,
    }
  }

  return {
    last_sync: data.last_sync ? new Date(data.last_sync) : null,
    sync_enabled: data.sync_enabled,
    connected: true,
  }
}

/**
 * Enable/disable sync
 */
export async function setSyncEnabled(userId: string, enabled: boolean): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('google_calendar_credentials')
    .update({ sync_enabled: enabled })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to update sync status: ${error.message}`)
  }
}
