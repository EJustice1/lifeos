'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  generateAuthUrl,
  validateState,
  exchangeCodeForTokens,
  storeTokens,
  deleteTokens,
  revokeToken,
  loadTokens,
} from '../integrations/google-calendar/oauth'
import {
  syncGoogleCalendar,
  getSyncStatus,
  setSyncEnabled,
} from '../integrations/google-calendar/sync'
import { createCalendarHandler } from '../integrations/google-calendar/GoogleCalendarHandler'

// ===================================================================
// OAUTH FLOW
// ===================================================================

/**
 * Initiate Google Calendar OAuth flow
 * @returns Authorization URL to redirect user to
 */
export async function initiateGoogleCalendarAuth(): Promise<{ authUrl: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { url } = generateAuthUrl(user.id)

  return { authUrl: url }
}

/**
 * Handle OAuth callback from Google
 * @param code Authorization code from Google
 * @param state State token for CSRF protection
 */
export async function handleGoogleCalendarCallback(
  code: string,
  state: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Validate CSRF state token
  if (!validateState(state, user.id)) {
    throw new Error('Invalid state token')
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code)

  // Get primary calendar ID
  const handler = createCalendarHandler(user.id)
  const calendars = await handler.listCalendars()
  const primaryCalendar = calendars.find(cal => cal.primary)

  // Store tokens in database
  await storeTokens(user.id, tokens, primaryCalendar?.id)

  // Perform initial sync
  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  await syncGoogleCalendar(user.id, twoWeeksAgo, twoWeeksLater)

  revalidatePath('/')
  revalidatePath('/settings/google-calendar')
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGoogleCalendar(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Load tokens to revoke them
  const tokens = await loadTokens(user.id)

  if (tokens) {
    try {
      // Revoke access
      await revokeToken(tokens.access_token)
    } catch (error) {
      console.warn('Failed to revoke token:', error)
      // Continue with deletion even if revoke fails
    }
  }

  // Delete tokens from database
  await deleteTokens(user.id)

  revalidatePath('/')
  revalidatePath('/settings/google-calendar')
}

// ===================================================================
// SYNC OPERATIONS
// ===================================================================

/**
 * Manually trigger sync with Google Calendar
 * @param startDate Start date for sync window (default: 2 weeks ago)
 * @param endDate End date for sync window (default: 2 weeks from now)
 */
export async function manualSyncGoogleCalendar(
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const now = new Date()
  const start = startDate ? new Date(startDate) : new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const end = endDate ? new Date(endDate) : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const result = await syncGoogleCalendar(user.id, start, end)

  revalidatePath('/')

  return result
}

/**
 * Get sync status for current user
 */
export async function getGoogleCalendarSyncStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      last_sync: null,
      sync_enabled: false,
      connected: false,
    }
  }

  return getSyncStatus(user.id)
}

/**
 * Enable or disable automatic sync
 */
export async function setGoogleCalendarSyncEnabled(enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  await setSyncEnabled(user.id, enabled)

  revalidatePath('/settings/google-calendar')
}

// ===================================================================
// CALENDAR EVENT OPERATIONS
// ===================================================================

/**
 * Get calendar events for a date range
 */
export async function getCalendarEvents(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('google_calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', startDate)
    .lte('end_time', endDate)
    .eq('is_deleted', false)
    .order('start_time', { ascending: true })

  return data || []
}

/**
 * Get calendar events for today
 */
export async function getTodayCalendarEvents() {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  return getCalendarEvents(startOfDay, endOfDay)
}

/**
 * Create a calendar event from a task
 * @param taskId Task ID to create event for
 */
export async function createCalendarEventForTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Mark task as pending sync
  const { error } = await supabase
    .from('tasks')
    .update({ gcal_sync_status: 'pending' })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to mark task for sync: ${error.message}`)
  }

  // Trigger sync
  await manualSyncGoogleCalendar()

  revalidatePath('/')
}

/**
 * Test Google Calendar connection
 */
export async function testGoogleCalendarConnection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    const handler = createCalendarHandler(user.id)
    const connected = await handler.testConnection()

    return { connected, error: null }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }
  }
}

/**
 * Get list of user's calendars
 */
export async function getUserCalendars() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const handler = createCalendarHandler(user.id)
  const calendars = await handler.listCalendars()

  return calendars
}

/**
 * Update primary calendar for sync
 */
export async function updatePrimaryCalendar(calendarId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('google_calendar_credentials')
    .update({ calendar_id: calendarId })
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to update calendar: ${error.message}`)
  }

  revalidatePath('/settings/google-calendar')
}
