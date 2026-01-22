-- Create muscle_group_targets table for tracking weekly volume goals
CREATE TABLE muscle_group_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  muscle_group TEXT NOT NULL,
  target_sets_per_week INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, muscle_group)
);

-- Enable Row Level Security
ALTER TABLE muscle_group_targets ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own targets
CREATE POLICY "Users can manage own muscle group targets"
ON muscle_group_targets
  FOR ALL USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX muscle_group_targets_user_idx ON muscle_group_targets(user_id);

-- Function to seed default muscle group targets for new users
CREATE OR REPLACE FUNCTION seed_muscle_group_targets()
RETURNS TRIGGER AS $$
DECLARE
  muscle_groups TEXT[] := ARRAY['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'core'];
  mg TEXT;
BEGIN
  FOREACH mg IN ARRAY muscle_groups LOOP
    INSERT INTO muscle_group_targets (user_id, muscle_group, target_sets_per_week)
    VALUES (NEW.id, mg, 12)
    ON CONFLICT (user_id, muscle_group) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We'll create the trigger on profiles table insert
-- This assumes a profiles table exists (checking from existing migrations)
-- If users are created via auth.users directly, we may need to adjust this

-- Create materialized view for exercise performance history (fast chart queries)
CREATE MATERIALIZED VIEW exercise_performance_history AS
SELECT
  l.user_id,
  l.exercise_id,
  DATE_TRUNC('day', w.date::TIMESTAMPTZ) AS date,
  MAX(l.weight) AS max_weight,
  MAX(l.reps) AS max_reps,
  MAX(l.weight * (36.0 / (37.0 - LEAST(l.reps, 36)))) AS estimated_1rm,
  SUM(l.weight * l.reps) AS total_volume,
  COUNT(*) AS total_sets
FROM lifts l
JOIN workouts w ON l.workout_id = w.id
GROUP BY l.user_id, l.exercise_id, DATE_TRUNC('day', w.date::TIMESTAMPTZ)
ORDER BY l.user_id, l.exercise_id, date DESC;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON exercise_performance_history (user_id, exercise_id, date);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_exercise_performance_history()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_performance_history;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Schedule this to run daily (e.g., via pg_cron or external scheduler)
-- For now, it will be refreshed on-demand via the function
