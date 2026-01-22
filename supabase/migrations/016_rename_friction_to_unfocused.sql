-- Rename friction_factors column to unfocused_factors
ALTER TABLE daily_context_reviews 
  RENAME COLUMN friction_factors TO unfocused_factors;

-- Add comment for clarity
COMMENT ON COLUMN daily_context_reviews.unfocused_factors IS 
  'Factors that caused lack of focus during the day';
