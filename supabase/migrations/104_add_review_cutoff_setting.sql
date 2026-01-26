-- Add daily review cutoff hour setting
ALTER TABLE user_settings 
ADD COLUMN daily_review_cutoff_hour INTEGER DEFAULT 9 NOT NULL;

COMMENT ON COLUMN user_settings.daily_review_cutoff_hour IS 'Hour (0-23) when daily review switches from previous day to current day. Before this hour, review shows previous day data.';

-- Add constraint to ensure valid hour range
ALTER TABLE user_settings 
ADD CONSTRAINT daily_review_cutoff_hour_range CHECK (daily_review_cutoff_hour >= 0 AND daily_review_cutoff_hour <= 23);
