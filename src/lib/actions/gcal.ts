'use server'

import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { GoogleCalendarHandler } from './googleCalendarHandler'

type GoogleCalendarCredentials = Database['public']['Tables']['google_calendar_credentials']['Row']

async function getCredentials(userId: string): Promise<GoogleCalendarCredentials> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdmin() as any
  const { data, error } = await supabase
    .from('google_calendar_credentials')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  if (!data) throw new Error('No calendar credentials found')
  
  return data as GoogleCalendarCredentials
}

export async function getGoogleCalendarEvents(userId: string, calendarId: string, start: string, end: string) {
  const creds = await getCredentials(userId)
  const tokenExpiry = new Date(creds.token_expiry).getTime()
  const handler = new GoogleCalendarHandler(userId, creds.access_token, creds.refresh_token, tokenExpiry)
  return await handler.listEvents(calendarId, start, end)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createGoogleCalendarEvent(userId: string, calendarId: string, event: any) {
  const creds = await getCredentials(userId)
  const tokenExpiry = new Date(creds.token_expiry).getTime()
  const handler = new GoogleCalendarHandler(userId, creds.access_token, creds.refresh_token, tokenExpiry)
  return await handler.createEvent(calendarId, event)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateGoogleCalendarEvent(userId: string, calendarId: string, eventId: string, event: any) {
  const creds = await getCredentials(userId)
  const tokenExpiry = new Date(creds.token_expiry).getTime()
  const handler = new GoogleCalendarHandler(userId, creds.access_token, creds.refresh_token, tokenExpiry)
  return await handler.updateEvent(calendarId, eventId, event)
}

export async function deleteGoogleCalendarEvent(userId: string, calendarId: string, eventId: string) {
  const creds = await getCredentials(userId)
  const tokenExpiry = new Date(creds.token_expiry).getTime()
  const handler = new GoogleCalendarHandler(userId, creds.access_token, creds.refresh_token, tokenExpiry)
  return await handler.deleteEvent(calendarId, eventId)
}
