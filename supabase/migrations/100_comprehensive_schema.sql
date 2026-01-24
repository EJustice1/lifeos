-- ===================================================================
-- LifeOS Comprehensive Schema Migration
-- ===================================================================
-- This migration creates the complete LifeOS database schema from scratch
-- It replaces all previous migrations (001-017) with a single comprehensive setup
--
-- Modules included:
-- - Profiles & Authentication
-- - Gym & Fitness Tracking
-- - Study & Career Tracking
-- - Digital Wellbeing
-- - Daily Context Reviews
-- - User Settings
-- ===================================================================

-- ===================================================================
-- EXTENSIONS
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- PROFILES & AUTHENTICATION
-- ===================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  display_name TEXT,
  timezone TEXT DEFAULT 'America/New_York' NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ===================================================================
-- GYM & FITNESS MODULE
-- ===================================================================

-- Workouts table
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  type TEXT,
  notes TEXT,
  total_volume NUMERIC(12, 2) DEFAULT 0 NOT NULL
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workouts" ON workouts 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX workouts_user_date_idx ON workouts(user_id, date DESC);

-- Lifts table (individual sets)
CREATE TABLE lifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts ON DELETE CASCADE NOT NULL,
  exercise_id INT NOT NULL,
  set_number INT NOT NULL,
  reps INT NOT NULL,
  weight NUMERIC(8, 2) NOT NULL,
  rpe INT CHECK (rpe >= 1 AND rpe <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE lifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lifts" ON lifts 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX lifts_workout_idx ON lifts(workout_id);
CREATE INDEX lifts_user_exercise_idx ON lifts(user_id, exercise_id);

-- Personal Records table
CREATE TABLE personal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  exercise_id INT NOT NULL,
  weight NUMERIC(8, 2) NOT NULL,
  reps INT NOT NULL,
  estimated_1rm NUMERIC(8, 2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, exercise_id)
);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own PRs" ON personal_records 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX prs_user_exercise_idx ON personal_records(user_id, exercise_id);

-- Muscle Group Targets table
CREATE TABLE muscle_group_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  muscle_group TEXT NOT NULL,
  target_sets_per_week INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, muscle_group)
);

ALTER TABLE muscle_group_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own muscle group targets" ON muscle_group_targets
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX muscle_group_targets_user_idx ON muscle_group_targets(user_id);

-- Gym Progress History table
CREATE TABLE gym_progress_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  exercise_id INTEGER NOT NULL,
  date DATE NOT NULL,
  one_rep_max DECIMAL(8, 2) NOT NULL,
  estimated_from_reps INTEGER,
  estimated_from_weight DECIMAL(8, 2),
  workout_id UUID REFERENCES workouts ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, exercise_id, date)
);

ALTER TABLE gym_progress_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gym progress history" ON gym_progress_history
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX gym_progress_history_user_idx ON gym_progress_history(user_id);
CREATE INDEX gym_progress_history_exercise_idx ON gym_progress_history(exercise_id);
CREATE INDEX gym_progress_history_date_idx ON gym_progress_history(date);
CREATE INDEX gym_progress_history_user_date_idx ON gym_progress_history(user_id, date DESC);
CREATE INDEX gym_progress_history_user_exercise_idx ON gym_progress_history(user_id, exercise_id);

-- Gym Progress Snapshots table
CREATE TABLE gym_progress_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

ALTER TABLE gym_progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gym progress snapshots" ON gym_progress_snapshots
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX gym_progress_snapshots_user_idx ON gym_progress_snapshots(user_id);
CREATE INDEX gym_progress_snapshots_date_idx ON gym_progress_snapshots(date);
CREATE INDEX gym_progress_snapshots_user_date_idx ON gym_progress_snapshots(user_id, date DESC);

-- Gym Strength Standards table
CREATE TABLE gym_strength_standards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'unisex')),
  weight_class TEXT CHECK (weight_class IN ('light', 'medium', 'heavy')),
  beginner DECIMAL(8, 2) NOT NULL,
  intermediate DECIMAL(8, 2) NOT NULL,
  advanced DECIMAL(8, 2) NOT NULL,
  elite DECIMAL(8, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(exercise_id, gender, weight_class)
);

ALTER TABLE gym_strength_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view strength standards" ON gym_strength_standards
  FOR SELECT USING (true);

CREATE INDEX gym_strength_standards_exercise_idx ON gym_strength_standards(exercise_id);
CREATE INDEX gym_strength_standards_gender_idx ON gym_strength_standards(gender);
CREATE INDEX gym_strength_standards_weight_class_idx ON gym_strength_standards(weight_class);

-- Gym Cache table
CREATE TABLE gym_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, cache_key)
);

ALTER TABLE gym_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cache" ON gym_cache
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX gym_cache_user_idx ON gym_cache(user_id);
CREATE INDEX gym_cache_expires_idx ON gym_cache(expires_at);
CREATE INDEX gym_cache_user_key_idx ON gym_cache(user_id, cache_key);

COMMENT ON TABLE gym_cache IS 'Server-side cache for expensive gym computations';

-- Exercise Performance History Materialized View
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

CREATE UNIQUE INDEX ON exercise_performance_history (user_id, exercise_id, date);

-- ===================================================================
-- STUDY & CAREER MODULE
-- ===================================================================

-- Buckets table (classes, projects, work categories)
CREATE TABLE buckets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('class', 'lab', 'project', 'work', 'other')) NOT NULL,
  color TEXT DEFAULT '#3b82f6' NOT NULL,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own buckets" ON buckets 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX buckets_user_id_idx ON buckets(user_id);

-- Study Sessions table
CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  bucket_id UUID REFERENCES buckets ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INT DEFAULT 0 NOT NULL,
  notes TEXT
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON study_sessions 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX study_sessions_user_date_idx ON study_sessions(user_id, date DESC);

-- ===================================================================
-- DIGITAL WELLBEING MODULE
-- ===================================================================

-- Screen Time table (daily aggregates)
CREATE TABLE screen_time (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  productive_minutes INT DEFAULT 0 NOT NULL,
  distracted_minutes INT DEFAULT 0 NOT NULL,
  mobile_minutes INT DEFAULT 0 NOT NULL,
  desktop_minutes INT DEFAULT 0 NOT NULL,
  source TEXT CHECK (source IN ('rescuetime', 'manual')) DEFAULT 'manual' NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

ALTER TABLE screen_time ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own screen time" ON screen_time 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX screen_time_user_date_idx ON screen_time(user_id, date DESC);

-- App Usage table (detailed breakdown)
CREATE TABLE app_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  app_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('productive', 'neutral', 'distracted')) NOT NULL,
  minutes INT NOT NULL
);

ALTER TABLE app_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own app usage" ON app_usage 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX app_usage_user_date_idx ON app_usage(user_id, date DESC);

-- ===================================================================
-- DAILY CONTEXT REVIEWS MODULE
-- ===================================================================

CREATE TABLE daily_context_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  execution_score INTEGER NOT NULL,
  focus_quality INTEGER NOT NULL,
  physical_vitality INTEGER NOT NULL,
  unfocused_factors TEXT[] DEFAULT '{}' NOT NULL,
  lesson_learned TEXT,
  highlights TEXT,
  tomorrow_goals TEXT[] DEFAULT '{}' NOT NULL,
  yesterday_goals TEXT[] DEFAULT '{}' NOT NULL,
  productive_screen_minutes INTEGER DEFAULT 0,
  distracted_screen_minutes INTEGER DEFAULT 0,
  execution_score_suggested INTEGER,
  execution_score_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

ALTER TABLE daily_context_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own context reviews" ON daily_context_reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX daily_context_reviews_user_date_idx ON daily_context_reviews(user_id, date DESC);
CREATE INDEX idx_daily_reviews_locked_scores ON daily_context_reviews(user_id, execution_score_locked) WHERE execution_score_locked = TRUE;

COMMENT ON COLUMN daily_context_reviews.unfocused_factors IS 'Factors that caused lack of focus during the day';
COMMENT ON COLUMN daily_context_reviews.productive_screen_minutes IS 'Manually entered productive screentime (work, learning) in minutes';
COMMENT ON COLUMN daily_context_reviews.distracted_screen_minutes IS 'Manually entered distracted screentime (social, entertainment) in minutes';
COMMENT ON COLUMN daily_context_reviews.execution_score_suggested IS 'Algorithm-calculated suggested execution score based on behavioral data';
COMMENT ON COLUMN daily_context_reviews.execution_score_locked IS 'Whether the user overrode a score cap imposed by validation';

-- ===================================================================
-- USER SETTINGS MODULE
-- ===================================================================

CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  daily_study_target_minutes INTEGER DEFAULT 120 NOT NULL,
  daily_workout_target INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ===================================================================
-- FUNCTIONS & TRIGGERS
-- ===================================================================

-- Function: Seed default muscle group targets for new users
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

CREATE TRIGGER on_profile_created_seed_muscle_targets
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE PROCEDURE seed_muscle_group_targets();

-- Function: Get yesterday's goals for context display
CREATE OR REPLACE FUNCTION get_yesterday_goals(for_user_id UUID, for_date DATE)
RETURNS TEXT[] AS $$
DECLARE
  yesterday_date DATE := for_date - INTERVAL '1 day';
  goals TEXT[];
BEGIN
  SELECT tomorrow_goals INTO goals
  FROM daily_context_reviews
  WHERE user_id = for_user_id
    AND date = yesterday_date
  LIMIT 1;

  RETURN COALESCE(goals, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate gym progress snapshot
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
      'strengthBalanceScore', 75
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

-- Function: Backfill historical progress data from existing workouts
CREATE OR REPLACE FUNCTION backfill_gym_progress_history(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
  workout_record RECORD;
  lift_record RECORD;
  estimated_1rm DECIMAL(8, 2);
BEGIN
  FOR workout_record IN
    SELECT id, user_id, date
    FROM workouts
    WHERE user_id = user_id_param
    ORDER BY date
  LOOP
    FOR lift_record IN
      SELECT exercise_id, weight, reps
      FROM lifts
      WHERE workout_id = workout_record.id
    LOOP
      estimated_1rm := lift_record.weight * (36 / (37 - lift_record.reps));

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

-- Function: Refresh exercise performance history materialized view
CREATE OR REPLACE FUNCTION refresh_exercise_performance_history()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_performance_history;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get gym cache
CREATE OR REPLACE FUNCTION get_gym_cache(
  user_id_param UUID,
  cache_key_param TEXT
)
RETURNS JSONB AS $$
DECLARE
  cached_data JSONB;
BEGIN
  SELECT cache_data INTO cached_data
  FROM gym_cache
  WHERE user_id = user_id_param
    AND cache_key = cache_key_param
    AND expires_at > NOW();

  RETURN cached_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_gym_cache IS 'Retrieve cached data if not expired';

-- Function: Set gym cache
CREATE OR REPLACE FUNCTION set_gym_cache(
  user_id_param UUID,
  cache_key_param TEXT,
  cache_data_param JSONB,
  ttl_minutes INTEGER DEFAULT 5
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO gym_cache (user_id, cache_key, cache_data, expires_at)
  VALUES (
    user_id_param,
    cache_key_param,
    cache_data_param,
    NOW() + (ttl_minutes || ' minutes')::INTERVAL
  )
  ON CONFLICT (user_id, cache_key)
  DO UPDATE SET
    cache_data = cache_data_param,
    created_at = NOW(),
    expires_at = NOW() + (ttl_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_gym_cache IS 'Store data in cache with TTL';

-- Function: Invalidate gym cache
CREATE OR REPLACE FUNCTION invalidate_gym_cache(
  user_id_param UUID,
  cache_key_pattern TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF cache_key_pattern IS NULL THEN
    DELETE FROM gym_cache WHERE user_id = user_id_param;
  ELSE
    DELETE FROM gym_cache
    WHERE user_id = user_id_param
      AND cache_key LIKE cache_key_pattern;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION invalidate_gym_cache IS 'Clear cache entries by pattern';

-- Function: Clean expired gym cache
CREATE OR REPLACE FUNCTION clean_expired_gym_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM gym_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION clean_expired_gym_cache IS 'Remove expired cache entries';

-- Function: Invalidate cache on workout change (trigger function)
CREATE OR REPLACE FUNCTION invalidate_cache_on_workout_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM invalidate_gym_cache(OLD.user_id, 'gym_%');
    RETURN OLD;
  ELSE
    PERFORM invalidate_gym_cache(NEW.user_id, 'gym_%');
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers: Auto-invalidate cache when workouts or lifts change
CREATE TRIGGER invalidate_cache_on_workout_insert
  AFTER INSERT ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_cache_on_workout_change();

CREATE TRIGGER invalidate_cache_on_workout_update
  AFTER UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_cache_on_workout_change();

CREATE TRIGGER invalidate_cache_on_workout_delete
  AFTER DELETE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_cache_on_workout_change();

CREATE TRIGGER invalidate_cache_on_lift_insert
  AFTER INSERT ON lifts
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_cache_on_workout_change();

CREATE TRIGGER invalidate_cache_on_lift_update
  AFTER UPDATE ON lifts
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_cache_on_workout_change();

CREATE TRIGGER invalidate_cache_on_lift_delete
  AFTER DELETE ON lifts
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_cache_on_workout_change();

-- Function: Update user_settings updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- ===================================================================
-- SEED DATA
-- ===================================================================

-- Seed gym strength standards
INSERT INTO gym_strength_standards (
  exercise_id, gender, weight_class, beginner, intermediate, advanced, elite
)
VALUES
  -- Bench Press Standards
  (1, 'male', 'light', 115, 165, 225, 315),
  (1, 'male', 'medium', 135, 195, 275, 365),
  (1, 'male', 'heavy', 155, 225, 315, 405),
  (1, 'female', 'light', 65, 95, 135, 185),
  (1, 'female', 'medium', 75, 115, 165, 225),
  (1, 'female', 'heavy', 85, 135, 195, 275),

  -- Incline Dumbbell Press Standards
  (2, 'male', 'light', 85, 115, 150, 185),
  (2, 'male', 'medium', 95, 135, 175, 225),
  (2, 'male', 'heavy', 115, 155, 200, 250),
  (2, 'female', 'light', 35, 50, 75, 100),
  (2, 'female', 'medium', 45, 65, 95, 125),
  (2, 'female', 'heavy', 55, 85, 115, 150),

  -- Overhead Press Standards
  (3, 'male', 'light', 85, 115, 145, 185),
  (3, 'male', 'medium', 95, 135, 175, 225),
  (3, 'male', 'heavy', 115, 155, 205, 255),
  (3, 'female', 'light', 35, 50, 70, 95),
  (3, 'female', 'medium', 45, 65, 85, 115),
  (3, 'female', 'heavy', 55, 85, 105, 135),

  -- Deadlift Standards
  (6, 'male', 'light', 225, 315, 405, 500),
  (6, 'male', 'medium', 275, 365, 455, 550),
  (6, 'male', 'heavy', 315, 405, 500, 600),
  (6, 'female', 'light', 135, 185, 225, 275),
  (6, 'female', 'medium', 165, 225, 275, 315),
  (6, 'female', 'heavy', 185, 275, 315, 365),

  -- Barbell Row Standards
  (7, 'male', 'light', 135, 185, 225, 275),
  (7, 'male', 'medium', 155, 205, 255, 315),
  (7, 'male', 'heavy', 175, 235, 295, 365),
  (7, 'female', 'light', 75, 105, 135, 165),
  (7, 'female', 'medium', 85, 125, 165, 205),
  (7, 'female', 'heavy', 95, 145, 195, 245),

  -- Pull-up Standards (weight in lbs added to bodyweight)
  (8, 'male', 'light', 0, 25, 50, 75),
  (8, 'male', 'medium', 0, 35, 65, 95),
  (8, 'male', 'heavy', 0, 45, 85, 115),
  (8, 'female', 'light', 0, 0, 15, 35),
  (8, 'female', 'medium', 0, 0, 25, 55),
  (8, 'female', 'heavy', 0, 0, 35, 75),

  -- Squat Standards
  (11, 'male', 'light', 155, 225, 315, 405),
  (11, 'male', 'medium', 185, 275, 365, 455),
  (11, 'male', 'heavy', 225, 315, 405, 500),
  (11, 'female', 'light', 95, 135, 185, 225),
  (11, 'female', 'medium', 115, 165, 225, 275),
  (11, 'female', 'heavy', 135, 185, 275, 315),

  -- Leg Press Standards
  (12, 'male', 'light', 275, 365, 455, 550),
  (12, 'male', 'medium', 315, 405, 500, 600),
  (12, 'male', 'heavy', 365, 455, 550, 650),
  (12, 'female', 'light', 135, 185, 225, 275),
  (12, 'female', 'medium', 165, 225, 275, 315),
  (12, 'female', 'heavy', 185, 275, 315, 365),

  -- Romanian Deadlift Standards
  (13, 'male', 'light', 185, 225, 275, 315),
  (13, 'male', 'medium', 205, 255, 315, 365),
  (13, 'male', 'heavy', 225, 295, 365, 425),
  (13, 'female', 'light', 95, 135, 165, 185),
  (13, 'female', 'medium', 115, 165, 195, 225),
  (13, 'female', 'heavy', 135, 185, 225, 255),

  -- Plank Standards (in seconds)
  (23, 'male', 'light', 60, 120, 180, 240),
  (23, 'male', 'medium', 90, 150, 210, 270),
  (23, 'male', 'heavy', 120, 180, 240, 300),
  (23, 'female', 'light', 60, 120, 180, 240),
  (23, 'female', 'medium', 90, 150, 210, 270),
  (23, 'female', 'heavy', 120, 180, 240, 300),

  -- Cable Crunch Standards (weight in lbs)
  (24, 'male', 'light', 50, 75, 100, 125),
  (24, 'male', 'medium', 60, 90, 120, 150),
  (24, 'male', 'heavy', 70, 105, 140, 175),
  (24, 'female', 'light', 25, 40, 55, 70),
  (24, 'female', 'medium', 30, 45, 65, 85),
  (24, 'female', 'heavy', 35, 55, 75, 95)

ON CONFLICT (exercise_id, gender, weight_class) DO NOTHING;

-- ===================================================================
-- MIGRATION COMPLETE
-- ===================================================================
-- This migration has successfully created the complete LifeOS schema
-- All previous migrations (001-017) are now consolidated
-- ===================================================================
