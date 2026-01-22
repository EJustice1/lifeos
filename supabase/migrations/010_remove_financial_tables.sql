-- Migration to remove all financial-related tables
-- This migration drops all tables related to the finance module

-- Drop enhanced recurring transactions table
DROP TABLE IF EXISTS enhanced_recurring_transactions;

-- Drop stock price cache table
DROP TABLE IF EXISTS stock_price_cache;

-- Drop stock holdings table
DROP TABLE IF EXISTS stock_holdings;

-- Drop cash adjustments table
DROP TABLE IF EXISTS cash_adjustments;

-- Drop recurring transactions table
DROP TABLE IF EXISTS recurring_transactions;

-- Drop net worth snapshots table
DROP TABLE IF EXISTS net_worth_snapshots;

-- Drop transactions table
DROP TABLE IF EXISTS transactions;

-- Drop accounts table
DROP TABLE IF EXISTS accounts;

-- Drop the increment_balance function
DROP FUNCTION IF EXISTS increment_balance(account_id UUID, amount DECIMAL(15, 2));

-- Drop the calculate_next_occurrence function
DROP FUNCTION IF EXISTS calculate_next_occurrence(
  base_date TIMESTAMPTZ,
  frequency TEXT,
  start_date TIMESTAMPTZ
);

-- Drop the create_stock_price_cache_table function
DROP FUNCTION IF EXISTS create_stock_price_cache_table();