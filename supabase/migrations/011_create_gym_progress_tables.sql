-- Migration to create comprehensive gym progress tracking tables
-- This migration adds tables for historical progress tracking, strength standards, and progress snapshots

-- Create gym_progress_history table for tracking historical strength progress
CREATE TABLE IF NOT EXISTS gym_progress_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  exercise_id INTEGER NOT NULL,
  date DATE NOT NULL,
  one_rep_max DECIMAL(8, 2) NOT NULL,
  estimated_from_reps INTEGER,
  estimated_from_weight DECIMAL(8, 2),
  workout_id UUID REFERENCES workouts ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique progress entries per user/exercise/date
  UNIQUE(user_id, exercise_id, date)
);

-- Enable Row Level Security for gym_progress_history
ALTER TABLE gym_progress_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own progress history
CREATE POLICY "Users can manage own gym progress history"
ON gym_progress_history
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX gym_progress_history_user_idx ON gym_progress_history(user_id);
CREATE INDEX gym_progress_history_exercise_idx ON gym_progress_history(exercise_id);
CREATE INDEX gym_progress_history_date_idx ON gym_progress_history(date);
CREATE INDEX gym_progress_history_user_date_idx ON gym_progress_history(user_id, date DESC);
CREATE INDEX gym_progress_history_user_exercise_idx ON gym_progress_history(user_id, exercise_id);

-- Create gym_progress_snapshots table for comprehensive progress snapshots
CREATE TABLE IF NOT EXISTS gym_progress_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique snapshots per user/date
  UNIQUE(user_id, date)
);

-- Enable Row Level Security for gym_progress_snapshots
ALTER TABLE gym_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own progress snapshots
CREATE POLICY "Users can manage own gym progress snapshots"
ON gym_progress_snapshots
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX gym_progress_snapshots_user_idx ON gym_progress_snapshots(user_id);
CREATE INDEX gym_progress_snapshots_date_idx ON gym_progress_snapshots(date);
CREATE INDEX gym_progress_snapshots_user_date_idx ON gym_progress_snapshots(user_id, date DESC);

-- Create gym_strength_standards table for strength level comparisons
CREATE TABLE IF NOT EXISTS gym_strength_standards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'unisex')),
  weight_class TEXT CHECK (weight_class IN ('light', 'medium', 'heavy')),
  beginner DECIMAL(8, 2) NOT NULL,
  intermediate DECIMAL(8, 2) NOT NULL,
  advanced DECIMAL(8, 2) NOT NULL,
  elite DECIMAL(8, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique standards per exercise/gender/weight_class
  UNIQUE(exercise_id, gender, weight_class)
);

-- Enable Row Level Security for gym_strength_standards
ALTER TABLE gym_strength_standards ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view strength standards (read-only)
CREATE POLICY "Users can view strength standards"
ON gym_strength_standards
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX gym_strength_standards_exercise_idx ON gym_strength_standards(exercise_id);
CREATE INDEX gym_strength_standards_gender_idx ON gym_strength_standards(gender);
CREATE INDEX gym_strength_standards_weight_class_idx ON gym_strength_standards(weight_class);

-- Create function to generate progress snapshot
CREATE OR REPLACE FUNCTION generate_gym_progress_snapshot(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  snapshot_data JSONB;
  strength_metrics JSONB;
  volume_metrics JSONB;
  balance_scores JSONB;
  personal_records JSONB;
BEGIN
  -- Calculate strength metrics by muscle group
  strength_metrics := (
    SELECT jsonb_build_object(
      'push', jsonb_build_object('current', COALESCE(MAX(CASE WHEN exercise_id IN (1, 2, 3) THEN one_rep_max END), 0)),
      'pull', jsonb_build_object('current', COALESCE(MAX(CASE WHEN exercise_id IN (6, 7, 8) THEN one_rep_max END), 0)),
      'legs', jsonb_build_object('current', COALESCE(MAX(CASE WHEN exercise_id IN (11, 12, 13) THEN one_rep_max END), 0)),
      'core', jsonb_build_object('current', COALESCE(MAX(CASE WHEN exercise_id IN (23, 24) THEN one_rep_max END), 0))
    )
    FROM gym_progress_history
    WHERE user_id = user_id_param
    AND date >= CURRENT_DATE - INTERVAL '30 days'
  );

  -- Calculate volume metrics
  volume_metrics := (
    SELECT jsonb_build_object(
      'weeklyTotal', COALESCE(SUM(total_volume), 0),
      'monthlyTotal', COALESCE(SUM(total_volume) * 4, 0),
      'weeklyAverage', COALESCE(AVG(total_volume), 0)
    )
    FROM workouts
    WHERE user_id = user_id_param
    AND date >= CURRENT_DATE - INTERVAL '7 days'
  );

  -- Calculate balance scores
  balance_scores := (
    SELECT jsonb_build_object(
      'pushPullRatio',
        CASE
          WHEN COALESCE(MAX(CASE WHEN exercise_id IN (6, 7, 8) THEN one_rep_max END), 0) = 0
          THEN 0
          ELSE COALESCE(MAX(CASE WHEN exercise_id IN (1, 2, 3) THEN one_rep_max END), 0) /
               COALESCE(MAX(CASE WHEN exercise_id IN (6, 7, 8) THEN one_rep_max END), 0)
        END,
      'upperLowerRatio',
        CASE
          WHEN COALESCE(MAX(CASE WHEN exercise_id IN (11, 12, 13) THEN one_rep_max END), 0) = 0
          THEN 0
          ELSE (COALESCE(MAX(CASE WHEN exercise_id IN (1, 2, 3, 6, 7, 8) THEN one_rep_max END), 0) / 6) /
               COALESCE(MAX(CASE WHEN exercise_id IN (11, 12, 13) THEN one_rep_max END), 0)
        END,
      'strengthBalanceScore', 75 -- Placeholder for more complex calculation
    )
    FROM gym_progress_history
    WHERE user_id = user_id_param
    AND date >= CURRENT_DATE - INTERVAL '30 days'
  );

  -- Get recent personal records
  personal_records := (
    SELECT jsonb_agg(
      jsonb_build_object(
        'exercise', e.name,
        'current', gph.one_rep_max,
        'date', gph.date
      )
    )
    FROM gym_progress_history gph
    JOIN (
      SELECT exercise_id, MAX(one_rep_max) as max_1rm
      FROM gym_progress_history
      WHERE user_id = user_id_param
      GROUP BY exercise_id
    ) latest ON gph.exercise_id = latest.exercise_id AND gph.one_rep_max = latest.max_1rm
    JOIN (
      VALUES
        (1, 'Bench Press'),
        (2, 'Incline Dumbbell Press'),
        (3, 'Overhead Press'),
        (6, 'Deadlift'),
        (7, 'Barbell Row'),
        (8, 'Pull-up'),
        (11, 'Squat'),
        (12, 'Leg Press'),
        (13, 'Romanian Deadlift'),
        (23, 'Plank'),
        (24, 'Cable Crunch')
    ) AS e(id, name) ON gph.exercise_id = e.id
    WHERE gph.user_id = user_id_param
    AND gph.date >= CURRENT_DATE - INTERVAL '90 days'
  );

  -- Build complete snapshot
  snapshot_data := jsonb_build_object(
    'strengthMetrics', strength_metrics,
    'volumeMetrics', volume_metrics,
    'balanceScores', balance_scores,
    'personalRecords', personal_records,
    'generatedAt', NOW()
  );

  RETURN snapshot_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to backfill historical progress data from existing workouts
CREATE OR REPLACE FUNCTION backfill_gym_progress_history(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
  workout_record RECORD;
  lift_record RECORD;
  estimated_1rm DECIMAL(8, 2);
BEGIN
  -- Process all workouts for the user
  FOR workout_record IN
    SELECT id, user_id, date
    FROM workouts
    WHERE user_id = user_id_param
    ORDER BY date
  LOOP
    -- Process all lifts for each workout
    FOR lift_record IN
      SELECT exercise_id, weight, reps
      FROM lifts
      WHERE workout_id = workout_record.id
    LOOP
      -- Calculate estimated 1RM using Brzycki formula
      estimated_1rm := lift_record.weight * (36 / (37 - lift_record.reps));

      -- Insert progress history record
      INSERT INTO gym_progress_history (
        user_id, exercise_id, date, one_rep_max,
        estimated_from_reps, estimated_from_weight, workout_id
      ) VALUES (
        workout_record.user_id, lift_record.exercise_id, workout_record.date,
        estimated_1rm, lift_record.reps, lift_record.weight, workout_record.id
      )
      ON CONFLICT (user_id, exercise_id, date)
      DO UPDATE SET
        one_rep_max = EXCLUDED.one_rep_max,
        estimated_from_reps = EXCLUDED.estimated_from_reps,
        estimated_from_weight = EXCLUDED.estimated_from_weight,
        workout_id = EXCLUDED.workout_id;

      inserted_count := inserted_count + 1;
    END LOOP;
  END LOOP;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to seed initial strength standards
CREATE OR REPLACE FUNCTION seed_strength_standards()
RETURNS VOID AS $$
BEGIN
  -- Check if standards already exist
  IF NOT EXISTS (SELECT 1 FROM gym_strength_standards LIMIT 1) THEN
    -- Bench Press Standards
    INSERT INTO gym_strength_standards (exercise_id, gender, weight_class, beginner, intermediate, advanced, elite)
    VALUES
      (1, 'male', 'light', 115, 165, 225, 315),
      (1, 'male', 'medium', 135, 195, 275, 365),
      (1, 'male', 'heavy', 155, 225, 315, 405),
      (1, 'female', 'light', 65, 95, 135, 185),
      (1, 'female', 'medium', 75, 115, 165, 225),
      (1, 'female', 'heavy', 85, 135, 195, 275);

    -- Deadlift Standards
    INSERT INTO gym_strength_standards (exercise_id, gender, weight_class, beginner, intermediate, advanced, elite)
    VALUES
      (6, 'male', 'light', 225, 315, 405, 500),
      (6, 'male', 'medium', 275, 365, 455, 550),
      (6, 'male', 'heavy', 315, 405, 500, 600),
      (6, 'female', 'light', 135, 185, 225, 275),
      (6, 'female', 'medium', 165, 225, 275, 315),
      (6, 'female', 'heavy', 185, 275, 315, 365);

    -- Squat Standards
    INSERT INTO gym_strength_standards (exercise_id, gender, weight_class, beginner, intermediate, advanced, elite)
    VALUES
      (11, 'male', 'light', 155, 225, 315, 405),
      (11, 'male', 'medium', 185, 275, 365, 455),
      (11, 'male', 'heavy', 225, 315, 405, 500),
      (11, 'female', 'light', 95, 135, 185, 225),
      (11, 'female', 'medium', 115, 165, 225, 275),
      (11, 'female', 'heavy', 135, 185, 275, 315);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;