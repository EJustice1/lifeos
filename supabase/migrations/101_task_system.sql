-- ===================================================================
-- LifeOS Task Management System Migration
-- ===================================================================
-- This migration adds task management and Google Calendar integration
-- while preserving existing bucket/session tracking functionality
--
-- New modules:
-- - Life Goals & Projects (3-level hierarchy)
-- - Tasks (with Google Calendar sync)
-- - Task Completion Feedback (Active Cooldown data)
-- - Google Calendar Integration
--
-- Modifications to existing tables:
-- - study_sessions: Add feedback columns and task linking
-- - workouts: Add feedback columns and task linking
-- - daily_context_reviews: Add rollover tracking
-- ===================================================================

-- ===================================================================
-- TASK MANAGEMENT HIERARCHY
-- ===================================================================

-- Life Goals table (top-level hierarchy)
CREATE TABLE life_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health', 'career', 'relationships', 'finance', 'personal', 'other')),
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active' NOT NULL,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  archived BOOLEAN DEFAULT false NOT NULL
);

ALTER TABLE life_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own life goals" ON life_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX life_goals_user_id_idx ON life_goals(user_id);
CREATE INDEX life_goals_status_idx ON life_goals(status);
CREATE INDEX life_goals_user_status_idx ON life_goals(user_id, status) WHERE archived = false;

-- Projects table (middle hierarchy level)
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  life_goal_id UUID REFERENCES life_goals ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6' NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'on_hold', 'archived')) DEFAULT 'active' NOT NULL,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  archived BOOLEAN DEFAULT false NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX projects_user_id_idx ON projects(user_id);
CREATE INDEX projects_life_goal_id_idx ON projects(life_goal_id);
CREATE INDEX projects_status_idx ON projects(status);
CREATE INDEX projects_user_status_idx ON projects(user_id, status) WHERE archived = false;

-- Tasks table (actionable items)
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects ON DELETE SET NULL,
  bucket_id UUID REFERENCES buckets ON DELETE SET NULL,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('inbox', 'backlog', 'today', 'in_progress', 'completed', 'cancelled')) DEFAULT 'inbox' NOT NULL,

  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  duration_minutes INT,

  -- Google Calendar Integration
  gcal_event_id TEXT,
  gcal_sync_status TEXT CHECK (gcal_sync_status IN ('synced', 'pending', 'conflict', 'error')),
  gcal_last_sync TIMESTAMPTZ,

  -- Priority & Metadata
  priority INTEGER CHECK (priority >= 1 AND priority <= 5) DEFAULT 3,
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  promoted_to_today_at TIMESTAMPTZ,

  -- Position for ordering within day view
  position_in_day INTEGER
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_project_id_idx ON tasks(project_id);
CREATE INDEX tasks_bucket_id_idx ON tasks(bucket_id);
CREATE INDEX tasks_status_idx ON tasks(status);
CREATE INDEX tasks_scheduled_date_idx ON tasks(scheduled_date);
CREATE INDEX tasks_user_date_idx ON tasks(user_id, scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX tasks_user_status_idx ON tasks(user_id, status);
CREATE INDEX tasks_gcal_event_id_idx ON tasks(gcal_event_id) WHERE gcal_event_id IS NOT NULL;

-- Unique constraint: one task per gcal event
CREATE UNIQUE INDEX tasks_gcal_event_unique_idx ON tasks(gcal_event_id) WHERE gcal_event_id IS NOT NULL;

-- ===================================================================
-- TASK COMPLETION FEEDBACK (Active Cooldown)
-- ===================================================================

CREATE TABLE task_completion_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks ON DELETE CASCADE,
  session_id UUID,
  session_type TEXT CHECK (session_type IN ('study', 'workout', 'task')) NOT NULL,

  -- Ratings (1-5 stars)
  effort_rating INTEGER CHECK (effort_rating >= 1 AND effort_rating <= 5),
  focus_rating INTEGER CHECK (focus_rating >= 1 AND focus_rating <= 5),

  -- Failure tags (only if rating is low)
  failure_tags TEXT[] DEFAULT '{}',

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE task_completion_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback" ON task_completion_feedback
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX task_completion_feedback_user_id_idx ON task_completion_feedback(user_id);
CREATE INDEX task_completion_feedback_task_id_idx ON task_completion_feedback(task_id);
CREATE INDEX task_completion_feedback_session_idx ON task_completion_feedback(session_id, session_type);
CREATE INDEX task_completion_feedback_user_date_idx ON task_completion_feedback(user_id, created_at DESC);

-- ===================================================================
-- GOOGLE CALENDAR INTEGRATION
-- ===================================================================

-- Google Calendar Events (cache layer)
CREATE TABLE google_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  gcal_event_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,

  -- Event data (cached from Google)
  summary TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false NOT NULL,
  location TEXT,

  -- LifeOS integration
  task_id UUID REFERENCES tasks ON DELETE SET NULL,

  -- Sync metadata
  last_synced TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, gcal_event_id)
);

ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar events" ON google_calendar_events
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX gcal_events_user_id_idx ON google_calendar_events(user_id);
CREATE INDEX gcal_events_start_time_idx ON google_calendar_events(start_time);
CREATE INDEX gcal_events_user_date_idx ON google_calendar_events(user_id, start_time);
CREATE INDEX gcal_events_task_id_idx ON google_calendar_events(task_id);
CREATE INDEX gcal_events_gcal_id_idx ON google_calendar_events(gcal_event_id);

-- Google Calendar Credentials (OAuth tokens)
CREATE TABLE google_calendar_credentials (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  calendar_id TEXT,
  last_sync TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE google_calendar_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own credentials" ON google_calendar_credentials
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX gcal_credentials_user_id_idx ON google_calendar_credentials(user_id);

COMMENT ON TABLE google_calendar_credentials IS 'OAuth tokens for Google Calendar integration - should be encrypted at rest';

-- ===================================================================
-- MODIFICATIONS TO EXISTING TABLES
-- ===================================================================

-- Add Active Cooldown columns to study_sessions
ALTER TABLE study_sessions
  ADD COLUMN IF NOT EXISTS effort_rating INTEGER CHECK (effort_rating >= 1 AND effort_rating <= 5),
  ADD COLUMN IF NOT EXISTS focus_rating INTEGER CHECK (focus_rating >= 1 AND focus_rating <= 5),
  ADD COLUMN IF NOT EXISTS failure_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS study_sessions_task_id_idx ON study_sessions(task_id);

-- Add Active Cooldown columns to workouts
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS effort_rating INTEGER CHECK (effort_rating >= 1 AND effort_rating <= 5),
  ADD COLUMN IF NOT EXISTS feeling_rating INTEGER CHECK (feeling_rating >= 1 AND feeling_rating <= 5),
  ADD COLUMN IF NOT EXISTS failure_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS workouts_task_id_idx ON workouts(task_id);

-- Add rollover tracking to daily_context_reviews
ALTER TABLE daily_context_reviews
  ADD COLUMN IF NOT EXISTS incomplete_tasks_processed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rolled_over_task_ids UUID[] DEFAULT '{}';

-- ===================================================================
-- DATA MIGRATION
-- ===================================================================

-- Migration tracking table
CREATE TABLE IF NOT EXISTS migration_status (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  buckets_migrated BOOLEAN DEFAULT false,
  goals_migrated BOOLEAN DEFAULT false,
  migration_started_at TIMESTAMPTZ,
  migration_completed_at TIMESTAMPTZ
);

ALTER TABLE migration_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own migration status" ON migration_status
  FOR ALL USING (auth.uid() = user_id);

-- Function to migrate buckets to projects
CREATE OR REPLACE FUNCTION migrate_buckets_to_projects()
RETURNS void AS $$
BEGIN
  INSERT INTO projects (user_id, title, color, status, created_at, archived)
  SELECT
    user_id,
    name as title,
    color,
    CASE
      WHEN is_archived THEN 'archived'::TEXT
      ELSE 'active'::TEXT
    END as status,
    created_at,
    is_archived as archived
  FROM buckets
  WHERE NOT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.user_id = buckets.user_id
    AND p.title = buckets.name
  );

  UPDATE migration_status
  SET buckets_migrated = true
  WHERE user_id IN (SELECT DISTINCT user_id FROM buckets);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate tomorrow_goals to tasks
CREATE OR REPLACE FUNCTION migrate_goals_to_tasks()
RETURNS void AS $$
BEGIN
  -- Get the most recent daily review for each user
  WITH latest_reviews AS (
    SELECT DISTINCT ON (user_id)
      user_id,
      tomorrow_goals,
      date,
      created_at
    FROM daily_context_reviews
    WHERE array_length(tomorrow_goals, 1) > 0
    ORDER BY user_id, date DESC
  )
  INSERT INTO tasks (user_id, title, status, created_at, scheduled_date)
  SELECT
    lr.user_id,
    unnest(lr.tomorrow_goals) as title,
    'today'::TEXT as status,
    lr.created_at,
    lr.date + INTERVAL '1 day' as scheduled_date
  FROM latest_reviews lr
  WHERE NOT EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.user_id = lr.user_id
    AND t.title = ANY(lr.tomorrow_goals)
  );

  UPDATE migration_status
  SET goals_migrated = true
  WHERE user_id IN (
    SELECT DISTINCT user_id
    FROM daily_context_reviews
    WHERE array_length(tomorrow_goals, 1) > 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- UTILITY FUNCTIONS
-- ===================================================================

-- Function to get incomplete tasks for a given date
CREATE OR REPLACE FUNCTION get_incomplete_tasks(p_user_id UUID, p_date DATE)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  project_id UUID,
  bucket_id UUID,
  scheduled_time TIME,
  duration_minutes INT,
  priority INT,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.project_id,
    t.bucket_id,
    t.scheduled_time,
    t.duration_minutes,
    t.priority,
    t.tags
  FROM tasks t
  WHERE t.user_id = p_user_id
    AND t.scheduled_date = p_date
    AND t.status IN ('today', 'in_progress')
    AND t.completed_at IS NULL
  ORDER BY
    COALESCE(t.position_in_day, 999),
    COALESCE(t.scheduled_time, '23:59'::TIME),
    t.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tasks for a date range (for Day View)
CREATE OR REPLACE FUNCTION get_tasks_for_date_range(p_user_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  project_id UUID,
  bucket_id UUID,
  scheduled_date DATE,
  scheduled_time TIME,
  duration_minutes INT,
  priority INT,
  tags TEXT[],
  gcal_event_id TEXT,
  gcal_sync_status TEXT,
  position_in_day INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.status,
    t.project_id,
    t.bucket_id,
    t.scheduled_date,
    t.scheduled_time,
    t.duration_minutes,
    t.priority,
    t.tags,
    t.gcal_event_id,
    t.gcal_sync_status,
    t.position_in_day
  FROM tasks t
  WHERE t.user_id = p_user_id
    AND t.scheduled_date BETWEEN p_start_date AND p_end_date
    AND t.status != 'cancelled'
  ORDER BY
    t.scheduled_date,
    COALESCE(t.scheduled_time, '23:59'::TIME),
    COALESCE(t.position_in_day, 999),
    t.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- TRIGGERS
-- ===================================================================

-- Auto-update updated_at timestamp for life_goals
CREATE OR REPLACE FUNCTION update_life_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER life_goals_updated_at
  BEFORE UPDATE ON life_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_life_goals_updated_at();

-- Auto-update updated_at timestamp for projects
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Auto-update updated_at timestamp for tasks
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;

  -- Clear completed_at if status changes from completed
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON TABLE life_goals IS 'Top-level life goals (e.g., "Become Senior Engineer")';
COMMENT ON TABLE projects IS 'Projects nested under life goals (e.g., "Build LifeOS")';
COMMENT ON TABLE tasks IS 'Actionable tasks that can be scheduled and synced with Google Calendar';
COMMENT ON TABLE task_completion_feedback IS 'Post-activity feedback captured via Active Cooldown sheet';
COMMENT ON TABLE google_calendar_events IS 'Cached Google Calendar events for offline access and performance';
COMMENT ON COLUMN tasks.bucket_id IS 'Optional link to study bucket for launchpad routing to Study Timer';
COMMENT ON COLUMN tasks.gcal_event_id IS 'Google Calendar event ID for bidirectional sync';
COMMENT ON COLUMN tasks.gcal_sync_status IS 'Sync status: synced, pending (needs push), conflict (user must resolve), error';
COMMENT ON COLUMN tasks.position_in_day IS 'Manual ordering within Day View timeline';
COMMENT ON COLUMN tasks.promoted_to_today_at IS 'Timestamp when task was promoted from backlog to today';
