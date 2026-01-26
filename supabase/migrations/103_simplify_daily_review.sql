-- Simplify daily context reviews table
-- Remove unused rating fields (focus_quality, physical_vitality)
-- Remove productive/unproductive screentime split, use single total field

-- Add new simplified screentime column
ALTER TABLE daily_context_reviews 
ADD COLUMN IF NOT EXISTS screen_time_minutes INTEGER DEFAULT 0;

-- Drop old unused columns (safe to do - these are legacy fields)
ALTER TABLE daily_context_reviews 
DROP COLUMN IF EXISTS focus_quality,
DROP COLUMN IF EXISTS physical_vitality,
DROP COLUMN IF EXISTS productive_screen_minutes,
DROP COLUMN IF EXISTS distracted_screen_minutes;

-- Update screen_time table to have total_minutes field
ALTER TABLE screen_time
ADD COLUMN IF NOT EXISTS total_minutes INTEGER;

-- Comments
COMMENT ON COLUMN daily_context_reviews.screen_time_minutes IS 'Total screentime in minutes (no productive/unproductive split)';
COMMENT ON COLUMN screen_time.total_minutes IS 'Total screentime in minutes from daily review';
