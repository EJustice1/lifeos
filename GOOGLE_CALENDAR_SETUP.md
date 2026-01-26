# Google Calendar Integration Setup

## Required Environment Variables

Add the following to your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback
```

For production:
```env
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google-calendar/callback
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: Add your `GOOGLE_REDIRECT_URI`
     - Development: `http://localhost:3000/api/auth/google-calendar/callback`
     - Production: `https://lifeos-mu-two.vercel.app/api/auth/google-calendar/callback`
   - Save and copy the Client ID and Client Secret

5. Configure OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - User Type: External (or Internal if using Google Workspace)
   - Fill in app name, user support email, and developer contact
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/calendar.readonly`
   - Add test users (if in testing mode)

## Required Scopes

The integration requires these OAuth scopes:
- `https://www.googleapis.com/auth/calendar.events` - Read/write calendar events
- `https://www.googleapis.com/auth/calendar.readonly` - Read calendar metadata

## How to Connect

1. Navigate to Settings (`/m/settings`)
2. Click on "Google Calendar" in the Integrations section
3. Click "Connect Google Calendar"
4. Authorize the app in Google's OAuth flow
5. You'll be redirected back to the settings page
6. Enable auto-sync if desired

## Troubleshooting

**"Not Authorized" or connection fails:**
- Verify environment variables are set correctly
- Check that redirect URI matches exactly in Google Cloud Console
- Ensure Google Calendar API is enabled
- Check browser console for specific error messages

**Sync not working:**
- Test connection using "Test Connection" button
- Check that auto-sync is enabled
- Verify calendar permissions in Google account settings
- Check Supabase logs for sync errors

## Database Tables

The integration uses these tables:
- `google_calendar_credentials` - Stores OAuth tokens
- `google_calendar_events` - Cached calendar events
- `tasks` - Links tasks to calendar events via `gcal_event_id`
