/**
 * Google Calendar OAuth 2.0 Flow
 *
 * Required environment variables:
 * - GOOGLE_CLIENT_ID: OAuth 2.0 Client ID from Google Cloud Console
 * - GOOGLE_CLIENT_SECRET: OAuth 2.0 Client Secret
 * - GOOGLE_REDIRECT_URI: OAuth callback URL (e.g., https://yourapp.com/api/auth/google/callback)
 *
 * Required scopes:
 * - https://www.googleapis.com/auth/calendar.events (read/write events)
 * - https://www.googleapis.com/auth/calendar.readonly (read calendar metadata)
 */

import { createClient } from '@/lib/supabase/server'

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

export interface OAuthTokens {
  access_token: string
  refresh_token: string
  token_expiry: Date
}

/**
 * Generate OAuth authorization URL
 * @param userId User ID for CSRF state
 * @returns Authorization URL and state token
 */
export function generateAuthUrl(userId: string): { url: string; state: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    throw new Error('Missing Google OAuth configuration. Check GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI environment variables.')
  }

  // Generate CSRF state token
  const state = Buffer.from(
    JSON.stringify({
      userId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    })
  ).toString('base64')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Force consent screen to get refresh token
    state,
  })

  const url = `${GOOGLE_OAUTH_URL}?${params.toString()}`

  return { url, state }
}

/**
 * Validate CSRF state token
 * @param state State token from callback
 * @param expectedUserId Expected user ID
 * @returns True if valid
 */
export function validateState(state: string, expectedUserId: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
    const { userId, timestamp } = decoded

    // Check user ID matches
    if (userId !== expectedUserId) {
      console.error('State user ID mismatch')
      return false
    }

    // Check timestamp is within 10 minutes
    const age = Date.now() - timestamp
    if (age > 10 * 60 * 1000) {
      console.error('State token expired')
      return false
    }

    return true
  } catch (error) {
    console.error('Invalid state token:', error)
    return false
  }
}

/**
 * Exchange authorization code for tokens
 * @param code Authorization code from callback
 * @returns OAuth tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth configuration')
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for tokens: ${error}`)
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_expiry: new Date(Date.now() + data.expires_in * 1000),
  }
}

/**
 * Refresh access token using refresh token
 * @param refreshToken Refresh token
 * @returns New OAuth tokens
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth configuration')
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh access token: ${error}`)
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Refresh token stays the same
    token_expiry: new Date(Date.now() + data.expires_in * 1000),
  }
}

/**
 * Revoke OAuth tokens
 * @param token Access token or refresh token to revoke
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(GOOGLE_REVOKE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ token }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to revoke token: ${error}`)
  }
}

/**
 * Store OAuth tokens in database
 * @param userId User ID
 * @param tokens OAuth tokens
 * @param calendarId Primary calendar ID (optional)
 */
export async function storeTokens(
  userId: string,
  tokens: OAuthTokens,
  calendarId?: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('google_calendar_credentials')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.token_expiry.toISOString(),
      calendar_id: calendarId || null,
      sync_enabled: true,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    throw new Error(`Failed to store tokens: ${error.message}`)
  }
}

/**
 * Load OAuth tokens from database
 * @param userId User ID
 * @returns OAuth tokens or null if not found
 */
export async function loadTokens(userId: string): Promise<OAuthTokens | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('google_calendar_credentials')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_expiry: new Date(data.token_expiry),
  }
}

/**
 * Check if access token is expired
 * @param tokenExpiry Token expiry date
 * @returns True if expired or expiring soon (within 5 minutes)
 */
export function isTokenExpired(tokenExpiry: Date): boolean {
  const bufferMinutes = 5
  const expiryWithBuffer = new Date(tokenExpiry.getTime() - bufferMinutes * 60 * 1000)
  return new Date() >= expiryWithBuffer
}

/**
 * Get valid access token, refreshing if necessary
 * @param userId User ID
 * @returns Valid access token
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await loadTokens(userId)

  if (!tokens) {
    throw new Error('No Google Calendar credentials found. Please connect your Google Calendar.')
  }

  // Check if token is expired
  if (isTokenExpired(tokens.token_expiry)) {
    // Refresh token
    const newTokens = await refreshAccessToken(tokens.refresh_token)
    await storeTokens(userId, newTokens)
    return newTokens.access_token
  }

  return tokens.access_token
}

/**
 * Delete OAuth tokens from database
 * @param userId User ID
 */
export async function deleteTokens(userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('google_calendar_credentials')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete tokens: ${error.message}`)
  }
}
