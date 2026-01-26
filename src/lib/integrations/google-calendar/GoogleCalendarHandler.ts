/**
 * Google Calendar API Handler
 *
 * Provides CRUD operations for Google Calendar events with:
 * - Automatic token refresh
 * - Rate limiting
 * - Error handling
 * - Batch operations
 */

import { getValidAccessToken } from './oauth'
import { getRateLimiter } from './rate-limiter'

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
  updated?: string
  created?: string
}

export interface CreateEventInput {
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
}

export interface UpdateEventInput {
  summary?: string
  description?: string
  start?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
}

export class GoogleCalendarHandler {
  private userId: string
  private calendarId: string
  private rateLimiter = getRateLimiter()

  constructor(userId: string, calendarId: string = 'primary') {
    this.userId = userId
    this.calendarId = calendarId
  }

  /**
   * Get authorization headers with valid access token
   */
  private async getHeaders(): Promise<HeadersInit> {
    const accessToken = await getValidAccessToken(this.userId)
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Make API request with rate limiting
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.rateLimiter.enqueue(async () => {
      const headers = await this.getHeaders()
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Google Calendar API error (${response.status}): ${error}`)
      }

      return response.json()
    })
  }

  // ===================================================================
  // CRUD OPERATIONS
  // ===================================================================

  /**
   * Create a new calendar event
   */
  async createEvent(event: CreateEventInput): Promise<GoogleCalendarEvent> {
    const url = `${CALENDAR_API_BASE}/calendars/${this.calendarId}/events`

    return this.request<GoogleCalendarEvent>(url, {
      method: 'POST',
      body: JSON.stringify(event),
    })
  }

  /**
   * Get a single calendar event by ID
   */
  async getEvent(eventId: string): Promise<GoogleCalendarEvent> {
    const url = `${CALENDAR_API_BASE}/calendars/${this.calendarId}/events/${eventId}`

    return this.request<GoogleCalendarEvent>(url, {
      method: 'GET',
    })
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    eventId: string,
    updates: UpdateEventInput
  ): Promise<GoogleCalendarEvent> {
    const url = `${CALENDAR_API_BASE}/calendars/${this.calendarId}/events/${eventId}`

    return this.request<GoogleCalendarEvent>(url, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const url = `${CALENDAR_API_BASE}/calendars/${this.calendarId}/events/${eventId}`

    await this.request<void>(url, {
      method: 'DELETE',
    })
  }

  /**
   * List events within a date range
   */
  async listEvents(
    startDate: Date,
    endDate: Date,
    options: {
      maxResults?: number
      singleEvents?: boolean
      orderBy?: 'startTime' | 'updated'
      showDeleted?: boolean
    } = {}
  ): Promise<GoogleCalendarEvent[]> {
    const {
      maxResults = 250,
      singleEvents = true,
      orderBy = 'startTime',
      showDeleted = false,
    } = options

    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: maxResults.toString(),
      singleEvents: singleEvents.toString(),
      orderBy,
      showDeleted: showDeleted.toString(),
    })

    const url = `${CALENDAR_API_BASE}/calendars/${this.calendarId}/events?${params}`

    const response = await this.request<{ items: GoogleCalendarEvent[] }>(url, {
      method: 'GET',
    })

    return response.items || []
  }

  // ===================================================================
  // BATCH OPERATIONS
  // ===================================================================

  /**
   * Create multiple events in parallel
   * Note: Uses individual requests, not Google's batch API for simplicity
   */
  async batchCreateEvents(
    events: CreateEventInput[]
  ): Promise<{ created: GoogleCalendarEvent[]; errors: Error[] }> {
    const results = await Promise.allSettled(
      events.map(event => this.createEvent(event))
    )

    const created: GoogleCalendarEvent[] = []
    const errors: Error[] = []

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        created.push(result.value)
      } else {
        errors.push(result.reason)
      }
    })

    return { created, errors }
  }

  /**
   * Update multiple events in parallel
   */
  async batchUpdateEvents(
    updates: Array<{ eventId: string; updates: UpdateEventInput }>
  ): Promise<{ updated: GoogleCalendarEvent[]; errors: Error[] }> {
    const results = await Promise.allSettled(
      updates.map(({ eventId, updates: eventUpdates }) =>
        this.updateEvent(eventId, eventUpdates)
      )
    )

    const updated: GoogleCalendarEvent[] = []
    const errors: Error[] = []

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        updated.push(result.value)
      } else {
        errors.push(result.reason)
      }
    })

    return { updated, errors }
  }

  /**
   * Delete multiple events in parallel
   */
  async batchDeleteEvents(
    eventIds: string[]
  ): Promise<{ deleted: number; errors: Error[] }> {
    const results = await Promise.allSettled(
      eventIds.map(id => this.deleteEvent(id))
    )

    let deleted = 0
    const errors: Error[] = []

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        deleted++
      } else {
        errors.push(result.reason)
      }
    })

    return { deleted, errors }
  }

  // ===================================================================
  // CALENDAR METADATA
  // ===================================================================

  /**
   * Get calendar metadata
   */
  async getCalendarMetadata(): Promise<{
    id: string
    summary: string
    timeZone: string
    description?: string
  }> {
    const url = `${CALENDAR_API_BASE}/calendars/${this.calendarId}`

    return this.request(url, {
      method: 'GET',
    })
  }

  /**
   * List all calendars for the user
   */
  async listCalendars(): Promise<Array<{
    id: string
    summary: string
    primary?: boolean
    timeZone: string
  }>> {
    const url = `${CALENDAR_API_BASE}/users/me/calendarList`

    const response = await this.request<{ items: any[] }>(url, {
      method: 'GET',
    })

    return response.items || []
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * Check if user has calendar access
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCalendarMetadata()
      return true
    } catch (error) {
      console.error('Calendar connection test failed:', error)
      return false
    }
  }

  /**
   * Get rate limiter stats
   */
  getRateLimiterStats() {
    return this.rateLimiter.getStats()
  }
}

/**
 * Create a GoogleCalendarHandler instance
 */
export function createCalendarHandler(
  userId: string,
  calendarId: string = 'primary'
): GoogleCalendarHandler {
  return new GoogleCalendarHandler(userId, calendarId)
}
