-- Migration to add server-side cache table for computed data
-- This stores expensive computations to avoid recalculation

CREATE TABLE IF NOT EXISTS gym_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,

  -- Ensure unique cache keys per user
  UNIQUE(user_id, cache_key)
);

-- Enable Row Level Security
ALTER TABLE gym_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own cache
CREATE POLICY "Users can manage own cache"
ON gym_cache
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX gym_cache_user_idx ON gym_cache(user_id);
CREATE INDEX gym_cache_expires_idx ON gym_cache(expires_at);
CREATE INDEX gym_cache_user_key_idx ON gym_cache(user_id, cache_key);

-- Function to get cached data
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

-- Function to set cached data
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

-- Function to invalidate cache by pattern
CREATE OR REPLACE FUNCTION invalidate_gym_cache(
  user_id_param UUID,
  cache_key_pattern TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF cache_key_pattern IS NULL THEN
    -- Clear all cache for user
    DELETE FROM gym_cache WHERE user_id = user_id_param;
  ELSE
    -- Clear matching cache entries
    DELETE FROM gym_cache
    WHERE user_id = user_id_param
      AND cache_key LIKE cache_key_pattern;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache (run periodically)
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

-- Create a trigger to auto-invalidate cache when workouts or lifts change
CREATE OR REPLACE FUNCTION invalidate_cache_on_workout_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Invalidate cache for the user
  IF TG_OP = 'DELETE' THEN
    PERFORM invalidate_gym_cache(OLD.user_id, 'gym_%');
    RETURN OLD;
  ELSE
    PERFORM invalidate_gym_cache(NEW.user_id, 'gym_%');
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to invalidate cache
DROP TRIGGER IF EXISTS invalidate_cache_on_workout_insert ON workouts;
DROP TRIGGER IF EXISTS invalidate_cache_on_workout_update ON workouts;
DROP TRIGGER IF EXISTS invalidate_cache_on_workout_delete ON workouts;
DROP TRIGGER IF EXISTS invalidate_cache_on_lift_insert ON lifts;
DROP TRIGGER IF EXISTS invalidate_cache_on_lift_update ON lifts;
DROP TRIGGER IF EXISTS invalidate_cache_on_lift_delete ON lifts;

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

-- Comment
COMMENT ON TABLE gym_cache IS 'Server-side cache for expensive gym computations';
COMMENT ON FUNCTION get_gym_cache IS 'Retrieve cached data if not expired';
COMMENT ON FUNCTION set_gym_cache IS 'Store data in cache with TTL';
COMMENT ON FUNCTION invalidate_gym_cache IS 'Clear cache entries by pattern';
COMMENT ON FUNCTION clean_expired_gym_cache IS 'Remove expired cache entries';
