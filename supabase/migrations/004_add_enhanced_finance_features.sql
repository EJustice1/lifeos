-- Migration for enhanced finance features
-- This migration adds tables for stock price caching and enhanced recurring transactions

-- Create stock price cache table
CREATE TABLE IF NOT EXISTS stock_price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  price DECIMAL(15, 4) NOT NULL,
  currency TEXT DEFAULT 'USD',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique cache entries per user and symbol
  UNIQUE(user_id, symbol)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_price_cache_user_symbol ON stock_price_cache(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_stock_price_cache_expires ON stock_price_cache(expires_at);

-- Create enhanced recurring transactions table
CREATE TABLE IF NOT EXISTS enhanced_recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('cash', 'stock')),
  cash_type TEXT CHECK (cash_type IN ('deposit', 'withdrawal')),
  stock_type TEXT CHECK (stock_type IN ('buy', 'sell')),
  amount DECIMAL(15, 2) NOT NULL,
  symbol TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  next_occurrence TIMESTAMPTZ NOT NULL,
  last_occurrence TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one of cash_type or stock_type is set based on transaction_type
  CONSTRAINT check_transaction_fields CHECK (
    (transaction_type = 'cash' AND cash_type IS NOT NULL AND stock_type IS NULL) OR
    (transaction_type = 'stock' AND stock_type IS NOT NULL AND cash_type IS NULL)
  )
);

-- Create index for recurring transactions
CREATE INDEX IF NOT EXISTS idx_enhanced_recurring_user ON enhanced_recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_recurring_next_occurrence ON enhanced_recurring_transactions(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_enhanced_recurring_active ON enhanced_recurring_transactions(is_active) WHERE is_active = TRUE;

-- Create function to create stock price cache table if it doesn't exist
CREATE OR REPLACE FUNCTION create_stock_price_cache_table()
RETURNS VOID AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'stock_price_cache'
  ) THEN
    -- Create the table
    CREATE TABLE stock_price_cache (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      price DECIMAL(15, 4) NOT NULL,
      currency TEXT DEFAULT 'USD',
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      source TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, symbol)
    );

    -- Create indexes
    CREATE INDEX idx_stock_price_cache_user_symbol ON stock_price_cache(user_id, symbol);
    CREATE INDEX idx_stock_price_cache_expires ON stock_price_cache(expires_at);

    RAISE NOTICE 'Created stock_price_cache table';
  ELSE
    RAISE NOTICE 'stock_price_cache table already exists';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment account balance
CREATE OR REPLACE FUNCTION increment_balance(account_id UUID, amount DECIMAL(15, 2))
RETURNS DECIMAL(15, 2) AS $$
BEGIN
  UPDATE accounts SET balance = balance + amount WHERE id = account_id;
  RETURN (SELECT balance FROM accounts WHERE id = account_id);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate next occurrence for recurring transactions
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
  current_date TIMESTAMPTZ,
  frequency TEXT,
  start_date TIMESTAMPTZ
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  next_date TIMESTAMPTZ;
BEGIN
  IF frequency = 'daily' THEN
    next_date := current_date + INTERVAL '1 day';
  ELSIF frequency = 'weekly' THEN
    next_date := current_date + INTERVAL '1 week';
  ELSIF frequency = 'biweekly' THEN
    next_date := current_date + INTERVAL '2 weeks';
  ELSIF frequency = 'monthly' THEN
    next_date := current_date + INTERVAL '1 month';
  ELSIF frequency = 'quarterly' THEN
    next_date := current_date + INTERVAL '3 months';
  ELSIF frequency = 'yearly' THEN
    next_date := current_date + INTERVAL '1 year';
  ELSE
    next_date := current_date + INTERVAL '1 month'; -- Default to monthly
  END IF;

  -- Ensure next date is in the future
  IF next_date <= NOW() THEN
    next_date := NOW() + INTERVAL '1 day';
  END IF;

  -- If start date is in the future, use that as the first occurrence
  IF start_date > NOW() AND (next_date < start_date OR current_date < start_date) THEN
    next_date := start_date;
  END IF;

  RETURN next_date;
END;
$$ LANGUAGE plpgsql;