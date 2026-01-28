-- ===================================================================
-- Fix bucket_id NOT NULL constraint in study_sessions
-- ===================================================================
-- Migration 105 deprecated bucket_id in favor of project_id,
-- but left the NOT NULL constraint on bucket_id, causing inserts
-- to fail when only project_id is provided.
--
-- This migration removes the NOT NULL constraint from bucket_id
-- to allow it to be null during the deprecation period.
-- ===================================================================

-- Remove NOT NULL constraint from bucket_id
ALTER TABLE study_sessions
  ALTER COLUMN bucket_id DROP NOT NULL;

COMMENT ON COLUMN study_sessions.bucket_id IS 'DEPRECATED: Use project_id instead. This column is nullable and will be removed in a future migration.';
