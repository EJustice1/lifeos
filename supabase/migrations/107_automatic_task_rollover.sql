-- Migration: Automatic Task Rollover System
-- Description: Add tables to track automatic task rollover execution and audit log

-- Table to track last successful rollover per user
CREATE TABLE task_rollover_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_rollover_date DATE NOT NULL,
  last_rollover_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for rollover events
CREATE TABLE task_rollover_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rollover_date DATE NOT NULL,
  tasks_moved UUID[] NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX task_rollover_log_user_id_idx ON task_rollover_log(user_id);
CREATE INDEX task_rollover_log_rollover_date_idx ON task_rollover_log(rollover_date);
CREATE INDEX task_rollover_log_executed_at_idx ON task_rollover_log(executed_at DESC);

-- Enable Row Level Security
ALTER TABLE task_rollover_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_rollover_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_rollover_state
CREATE POLICY "Users can view own rollover state"
  ON task_rollover_state
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rollover state"
  ON task_rollover_state
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rollover state"
  ON task_rollover_state
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for task_rollover_log
CREATE POLICY "Users can view own rollover log"
  ON task_rollover_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rollover log"
  ON task_rollover_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rollover log"
  ON task_rollover_log
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE task_rollover_state IS 'Tracks the last automatic task rollover execution per user to ensure idempotency';
COMMENT ON TABLE task_rollover_log IS 'Audit log of automatic task rollover events with 5-minute undo window';
