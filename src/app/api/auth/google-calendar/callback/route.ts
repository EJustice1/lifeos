/**
 * Google Calendar OAuth Callback Handler
 *
 * This route handles the OAuth callback from Google after user authorization.
 * It exchanges the authorization code for tokens and stores them in the database.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleGoogleCalendarCallback } from '@/lib/actions/google-calendar'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/settings/google-calendar?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings/google-calendar?error=missing_parameters', request.url)
    )
  }

  try {
    // Handle the callback
    await handleGoogleCalendarCallback(code, state)

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/settings/google-calendar?success=true', request.url)
    )
  } catch (err) {
    console.error('OAuth callback error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    return NextResponse.redirect(
      new URL(
        `/settings/google-calendar?error=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    )
  }
}
