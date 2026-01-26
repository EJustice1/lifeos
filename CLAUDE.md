# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeOS is a personal operating system for tracking, analyzing, and optimizing life through objective metrics and effort-based growth. It's a mobile-first PWA that unifies workout tracking, study sessions, task management, and daily reflections into a single platform with integrated analytics.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (PostgreSQL + Auth), TailwindCSS 4, TypeScript

## Essential Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npx tsc --noEmit         # Type check without emitting files

# Database
supabase login           # Authenticate with Supabase CLI
supabase link            # Link to your Supabase project
supabase db push         # Apply migrations to your database
```

## Architecture Overview

### App Structure (Next.js App Router)

- **`/app`** - Route definitions with nested layouts
  - `/` - Root redirect to auth or actions
  - `/actions` - Main command center hub
  - `/auth/login` - Authentication page
  - `/tasks`, `/goals`, `/projects/new`, `/strategy` - Management views
  - **`/m/*`** - Mobile-optimized routes with special session handling:
    - `/m/gym` - Gym session tracker
    - `/m/study` - Study timer
    - `/m/daily-context-review` - Daily reflection workflow
    - `/m/settings` - User preferences

**Layout Hierarchy:**
```
Root Layout: ToastProvider → SessionProvider → TaskProvider
Mobile Layout (/m): SessionProvider (local) → SessionRecovery → ToastProvider
```

The dual SessionProvider pattern enables different session recovery strategies for mobile vs desktop.

### Core Library (`src/lib`)

**Server Actions (`src/lib/actions/`):**
- `gym.ts` - Workout CRUD, set logging, PR tracking
- `study.ts` - Study session management
- `tasks.ts` - Task CRUD with status transitions (backlog → today → completed)
- `daily-context-review.ts` - Daily reflection workflow
- `google-calendar.ts` - Bidirectional calendar sync
- `digital.ts` - Screen time tracking
- `feedback.ts` - Post-session feedback (Active Cooldown)
- `settings.ts` - User preferences
- `migration.ts` - Data migration utilities

**Key Utilities:**
- `gym-utils.ts` - Exercise library, 1RM calculations, muscle group mappings
- `execution-validator.ts` - Behavioral validation algorithm (7-point scale: Sabotage → Apex)
- `cache-utils.ts` - Server-side caching for expensive calculations
- `session-storage.ts` - localStorage wrapper with validation and expiration

**Hooks (`src/lib/hooks/`):**
- `useUnifiedSession.ts` - **Core session management** with atomic operations and rollback
- `useGymSession.ts` / `useStudySession.ts` - Domain-specific wrappers
- `useGoogleCalendarSync.ts` - Calendar sync state management
- `use-swipe-gestures.ts` - Touch gesture handling

**State Machines (`src/lib/machines/`):**
- `gymMachine.ts`, `studyMachine.ts`, `taskCreationMachine.ts` - XState-inspired state machines
- `useMachine.ts` - Generic state machine hook

**Google Calendar Integration (`src/lib/google-calendar/`):**
- `oauth.ts` - Token management with refresh
- `sync.ts` - Bidirectional sync (pull events → push tasks)
- `GoogleCalendarHandler.ts` - API abstraction
- `rate-limiter.ts` - Token bucket rate limiting

**Supabase Clients:**
- `supabase/server.ts` - Server Components/Actions (cookie-based auth)
- `supabase/client.ts` - Browser client

### Global State Management (`src/contexts`)

- **`TaskContext.tsx`** - Global task state with optimistic updates and rollback on error
- **`SessionContext.tsx`** - Cross-tab session persistence via localStorage + React state sync

### Component Organization (`src/components`)

- `mobile/` - Mobile-optimized UI (buttons, inputs, cards, modals)
- `day-view/` - Calendar timeline components (TimeGrid, DayTimeline, CalendarEventCard)
- `strategy/` - Strategic planning UI (ProjectCard, LifeGoalCard)
- `modals/` - Form modals (TaskFormModal, ProjectFormModal, etc.)
- `daily-review/` - Daily review workflow components
- `navigation/` - CommandCenterNav
- `widgets/` - Reusable UI components (StarRating, RatingWidget)

## Database Schema (Supabase)

**Migrations Location:** `supabase/migrations/`
- `100_comprehensive_schema.sql` - Initial schema with gym, study, and digital modules
- `101_task_system.sql` - Task management (3-level hierarchy)
- `102_command_center_schema.sql` - Command center additions
- `103_simplify_daily_review.sql` - Daily review updates

### Key Tables

**User & Auth:**
- `profiles` - User profiles (extends auth.users)

**Gym Module:**
- `workouts` - Workout sessions
- `lifts` - Individual sets (weight, reps, RPE)
- `personal_records` - PRs with estimated 1RM
- `muscle_group_targets` - Weekly volume targets
- `gym_progress_history` - Historical 1RM tracking
- `gym_cache` - Server-side cache with TTL

**Study Module:**
- `buckets` - Study categories
- `study_sessions` - Timed study sessions

**Task Management (3-level hierarchy):**
- `life_goals` - Top-level life goals
- `projects` - Mid-level projects (linked to life_goals)
- `tasks` - Actionable items with:
  - Status: `backlog` → `today` → `in_progress` → `completed`/`cancelled`
  - Scheduling: `scheduled_date`, `scheduled_time`, `duration_minutes`
  - Domain linking: `linked_domain` ('gym' | 'study') for auto-start
  - Google Calendar: `gcal_event_id`, `gcal_sync_status`

**Feedback & Reviews:**
- `task_completion_feedback` - Post-activity ratings
- `daily_context_reviews` - Daily reflections with execution scores

**Digital Wellbeing:**
- `screen_time` - Daily screen time aggregates
- `app_usage` - Per-app usage breakdowns

**Google Calendar:**
- `google_calendar_events` - Cached calendar events
- `google_calendar_credentials` - OAuth tokens (encrypted)

**Security:** All tables have Row Level Security (RLS) policies enforcing `auth.uid() = user_id`

## Critical Architectural Patterns

### Session Management (Atomic Operations)

The session management system prevents race conditions through a backup-rollback pattern:

```typescript
// Pattern used in useUnifiedSession
1. Create backup of current state
2. Clear state optimistically
3. Call server action (DB update)
4. On failure: Rollback to backup
5. On success: Confirm cleared state
```

**Key Features:**
- Single active session enforcement (server ends existing before creating new)
- localStorage + React state dual storage
- Cross-tab synchronization via storage events
- Session recovery with age validation (24-hour expiration)
- Auto-recovery component (`SessionRecovery`) for mobile routes

### Server Actions Pattern

All data mutations use Next.js Server Actions (`'use server'`) instead of REST API routes:
- Supabase client created per-request with cookie-based auth
- `revalidatePath()` for cache invalidation
- Error boundaries with user-facing messages
- No client-side database access

### Optimistic Updates with Rollback

Used in `TaskContext` for instant UI feedback:
- Assign temporary ID (`temp-${Date.now()}`)
- Update UI immediately
- Call server action
- Replace temp ID with real DB ID on success
- Rollback changes on failure

### Execution Score Validation

`execution-validator.ts` implements behavioral analysis:
- Hard caps based on objective data (screen time, study hours, workouts)
- Positive boosts for goal completion
- 7-point scale: Sabotage (0-14) → Decay (15-28) → Unfocused (29-42) → Maintenance (43-57) → Traction (58-71) → Velocity (72-85) → Apex (86-100)
- Algorithm provides suggested score and explanation

### State Machine Pattern

Complex workflows (gym, study, task creation) use explicit state machines:
- Config-driven state definitions
- Event-driven transitions
- `useMachine` generic hook for consistent implementation
- States: `idle → selecting_type → active → logging → ending → reviewing` (gym example)

### Google Calendar Bidirectional Sync

Flow:
1. Pull events from Google Calendar API
2. Compare against local cache (`google_calendar_events`)
3. Apply changes (create/update/delete local tasks)
4. Push local task changes back to Google
5. Update `gcal_sync_status` flags for conflict resolution

Rate limiting via token bucket algorithm in `rate-limiter.ts`.

## Development Guidelines

### Path Alias

Use `@/` for all imports from `src/`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { useUnifiedSession } from '@/lib/hooks/useUnifiedSession'
```

### Adding New Features

1. **Database Changes:** Add migration file to `supabase/migrations/` with incremented number
2. **Server Actions:** Add to appropriate file in `src/lib/actions/`
3. **Client Logic:** Create hook in `src/lib/hooks/` if needed
4. **UI:** Add components to relevant directory in `src/components/`
5. **Routes:** Add to `src/app/` with proper layout

### Mobile-First Considerations

- Touch targets: minimum 44x44px
- Gesture support via `use-swipe-gestures`
- Haptic feedback: `triggerHapticFeedback()` (LIGHT, MEDIUM, SUCCESS, ERROR)
- Optimized for iOS/Android web browsers
- Mobile routes under `/m` have dedicated session recovery

### Working with Sessions

When modifying gym or study sessions:
1. Use `useGymSession` or `useStudySession` hooks
2. Never directly mutate session state
3. Always handle async errors (hook provides rollback)
4. Server actions should call `endActiveSession()` before creating new sessions

### Testing Locally

1. Ensure Supabase project is linked: `supabase link`
2. Environment variables set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
3. Migrations applied: `supabase db push`
4. Test on mobile viewport or real device for accurate mobile UX

### Common Patterns

**Fetching Data in Server Components:**
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase.from('tasks').select('*')
```

**Server Action with Revalidation:**
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTask(taskId: string, updates: any) {
  const supabase = await createClient()
  // ... mutation logic
  revalidatePath('/tasks')
}
```

**Optimistic Update in Context:**
```typescript
// Update UI immediately
setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))

try {
  await serverAction(taskId, updates)
} catch (error) {
  // Rollback on error
  setTasks(originalTasks)
  throw error
}
```

## Environment Setup

Required environment variables (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional (for Google Calendar integration):
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Project Philosophy

- **Effort Over Outcomes:** Track inputs (time, consistency, execution quality)
- **Objective Context:** Ground reviews in measurable data
- **Friction Reduction:** Fast check-ins, minimal typing
- **Execution Tracking:** Not just *what* you did, but *how well* you executed

This is a personal productivity system optimized for individual use, not a multi-tenant SaaS.
