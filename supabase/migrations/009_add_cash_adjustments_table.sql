-- Add cash_adjustments table for tracking cash balance adjustments
CREATE TABLE cash_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE cash_adjustments ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own cash adjustments
CREATE POLICY "Users can manage own cash adjustments"
ON cash_adjustments
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX cash_adjustments_user_idx ON cash_adjustments(user_id);
CREATE INDEX cash_adjustments_account_idx ON cash_adjustments(account_id);
CREATE INDEX cash_adjustments_date_idx ON cash_adjustments(date);