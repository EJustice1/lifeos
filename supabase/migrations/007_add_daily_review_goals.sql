-- Add tomorrow_goals and yesterday_goals columns to daily_context_reviews table
ALTER TABLE daily_context_reviews
  ADD COLUMN tomorrow_goals TEXT[] DEFAULT '{}' NOT NULL;

ALTER TABLE daily_context_reviews
  ADD COLUMN yesterday_goals TEXT[] DEFAULT '{}' NOT NULL;

-- Function to get yesterday's goals for context display
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
