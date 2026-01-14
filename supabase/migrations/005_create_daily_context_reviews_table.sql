-- Create the daily_context_reviews table
CREATE TABLE daily_context_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  execution_score INTEGER NOT NULL,
  focus_quality INTEGER NOT NULL,
  physical_vitality INTEGER NOT NULL,
  friction_factors TEXT[] DEFAULT '{}' NOT NULL,
  lesson_learned TEXT,
  highlights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE daily_context_reviews ENABLE ROW LEVEL SECURITY;

-- Create policy for full access to own reviews
CREATE POLICY "Users can manage own context reviews"
ON daily_context_reviews
  FOR ALL USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX daily_context_reviews_user_date_idx
ON daily_context_reviews(user_id, date DESC);