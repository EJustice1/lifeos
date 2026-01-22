-- Add execution validation and screentime fields to daily_context_reviews table
ALTER TABLE daily_context_reviews
ADD COLUMN IF NOT EXISTS productive_screen_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS distracted_screen_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS execution_score_suggested INTEGER,
ADD COLUMN IF NOT EXISTS execution_score_locked BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN daily_context_reviews.productive_screen_minutes IS 'Manually entered productive screentime (work, learning) in minutes';
COMMENT ON COLUMN daily_context_reviews.distracted_screen_minutes IS 'Manually entered distracted screentime (social, entertainment) in minutes';
COMMENT ON COLUMN daily_context_reviews.execution_score_suggested IS 'Algorithm-calculated suggested execution score based on behavioral data';
COMMENT ON COLUMN daily_context_reviews.execution_score_locked IS 'Whether the user overrode a score cap imposed by validation';

-- Create index for querying locked scores (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_daily_reviews_locked_scores
  ON daily_context_reviews(user_id, execution_score_locked)
  WHERE execution_score_locked = TRUE;
