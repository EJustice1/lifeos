import { google } from 'googleapis'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

interface TokenCredentials {
  access_token: string
  refresh_token: string
  token_expiry: string
}

/**
 * Handles Google Calendar API operations with automatic token refresh.
 * Uses the admin Supabase client to update tokens (bypasses RLS).
 */
export class GoogleCalendarHandler {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>
  private userId: string

  constructor(userId: string, accessToken: string, refreshToken: string, expiryDate: number) {
    this.userId = userId
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      scope: SCOPES.join(' '),
      token_type: 'Bearer',
      expiry_date: expiryDate
    })
  }

  async refreshToken() {
    const newToken = await this.oauth2Client.refreshAccessToken()
    const tokenInfo = newToken.credentials
    
    // Convert expiry_date (number in ms) to ISO string for database
    const tokenExpiryISO = new Date(tokenInfo.expiry_date!).toISOString()
    
    // Use admin client for token updates (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdmin() as any
    const { error } = await supabase
      .from('google_calendar_credentials')
      .update({ 
        access_token: tokenInfo.access_token, 
        refresh_token: tokenInfo.refresh_token, 
        token_expiry: tokenExpiryISO 
      })
      .eq('user_id', this.userId)
    
    if (error) {
      throw new Error(`Failed to refresh token: ${error.message}`)
    }
    
    this.oauth2Client.setCredentials(tokenInfo)
  }

  async listEvents(calendarId: string, start: string, end: string) {
    await this.ensureFreshToken()
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    const res = await calendar.events.list({ 
      calendarId, 
      timeMin: start, 
      timeMax: end, 
      singleEvents: true, 
      orderBy: 'startTime' 
    })
    return res.data.items
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createEvent(calendarId: string, event: any) {
    await this.ensureFreshToken()
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    const res = await calendar.events.insert({ calendarId, requestBody: event })
    return res.data
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateEvent(calendarId: string, eventId: string, event: any) {
    await this.ensureFreshToken()
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    const res = await calendar.events.update({ calendarId, eventId, requestBody: event })
    return res.data
  }

  async deleteEvent(calendarId: string, eventId: string) {
    await this.ensureFreshToken()
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    await calendar.events.delete({ calendarId, eventId })
  }

  private async ensureFreshToken() {
    const now = Date.now()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdmin() as any
    const { data } = await supabase
      .from('google_calendar_credentials')
      .select('access_token,refresh_token,token_expiry')
      .eq('user_id', this.userId)
      .single() as { data: TokenCredentials | null }
    
    if (data && new Date(data.token_expiry).getTime() < now) {
      await this.refreshToken()
    }
  }
}
