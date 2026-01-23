-- Migration: Comprehensive Cleanup
-- This migration clears all data and removes unused tables

-- ==========================================
-- STEP 1: Clear all data from all tables
-- ==========================================
-- Truncating profiles will cascade delete all related data
-- due to foreign key constraints (ON DELETE CASCADE)
TRUNCATE profiles CASCADE;

-- ==========================================
-- STEP 2: Drop unused tables
-- ==========================================

-- Drop old daily_reviews table (replaced by daily_context_reviews)
DROP TABLE IF EXISTS daily_reviews CASCADE;

-- Drop old exercises table (replaced by lifts)
DROP TABLE IF EXISTS exercises CASCADE;

-- ==========================================
-- STEP 3: Verify finance tables are removed
-- ==========================================
-- These should already be dropped from migration 010,
-- but we ensure they're gone

DROP TABLE IF EXISTS net_worth_snapshots CASCADE;
DROP TABLE IF EXISTS stock_price_cache CASCADE;
DROP TABLE IF EXISTS stock_holdings CASCADE;
DROP TABLE IF EXISTS enhanced_recurring_transactions CASCADE;
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS cash_adjustments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- Drop any remaining finance-related functions
DROP FUNCTION IF EXISTS increment_balance(UUID, DECIMAL);
DROP FUNCTION IF EXISTS calculate_next_occurrence(TIMESTAMPTZ, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS create_stock_price_cache_table();

-- ==========================================
-- STEP 4: Remove old trigger that seeds exercises
-- ==========================================
-- Since we dropped the exercises table, remove the trigger
-- that was seeding default exercises
DROP TRIGGER IF EXISTS on_profile_created_seed_exercises ON profiles;
DROP FUNCTION IF EXISTS seed_default_exercises();
