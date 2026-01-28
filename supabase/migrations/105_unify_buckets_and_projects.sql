-- ===================================================================
-- LifeOS Bucket-Project Unification Migration
-- ===================================================================
-- This migration unifies the separate bucket and project systems
-- into a single unified project model that supports both task
-- hierarchy and study session tracking.
--
-- Changes:
-- 1. Add 'type' field to projects table
-- 2. Migrate study_sessions to use project_id instead of bucket_id
-- 3. Remove bucket_id from tasks table
-- 4. Deprecate buckets table (keep for reference)
-- ===================================================================

-- ===================================================================
-- STEP 1: Add type field to projects table
-- ===================================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('class', 'lab', 'project', 'work', 'other'));

COMMENT ON COLUMN projects.type IS 'Optional categorization for projects (inherited from buckets system)';

-- ===================================================================
-- STEP 2: Migrate study_sessions to use projects
-- ===================================================================

-- First, add the new project_id column
ALTER TABLE study_sessions
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects ON DELETE CASCADE;

-- Copy data from bucket_id to project_id (users will need to manually map buckets to projects)
-- For now, we'll just add the column and let it be null
COMMENT ON COLUMN study_sessions.project_id IS 'References projects table (replaces bucket_id)';

-- Drop the old bucket_id foreign key constraint
ALTER TABLE study_sessions
  DROP CONSTRAINT IF EXISTS study_sessions_bucket_id_fkey;

-- Drop the old index
DROP INDEX IF EXISTS study_sessions_bucket_id_idx;

-- Create new index for project_id
CREATE INDEX IF NOT EXISTS study_sessions_project_id_idx ON study_sessions(project_id);

-- Mark bucket_id as deprecated (we'll keep it temporarily for user reference)
COMMENT ON COLUMN study_sessions.bucket_id IS 'DEPRECATED: Use project_id instead. This column will be removed in a future migration.';

-- ===================================================================
-- STEP 3: Remove bucket_id from tasks table
-- ===================================================================

-- Drop the bucket_id foreign key constraint
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_bucket_id_fkey;

-- Drop the bucket_id index
DROP INDEX IF EXISTS tasks_bucket_id_idx;

-- Drop the bucket_id column
ALTER TABLE tasks
  DROP COLUMN IF EXISTS bucket_id;

-- ===================================================================
-- STEP 4: Deprecate buckets table
-- ===================================================================

-- Add deprecation comment
COMMENT ON TABLE buckets IS 'DEPRECATED: This table has been replaced by the unified projects table. It is kept for historical reference only. New code should use projects table instead.';

-- Drop all RLS policies to prevent new writes
DROP POLICY IF EXISTS "Users can manage own buckets" ON buckets;

-- Create read-only policy for historical access
CREATE POLICY "Users can view own historical buckets" ON buckets
  FOR SELECT USING (auth.uid() = user_id);

-- ===================================================================
-- STEP 5: Add helper functions for migration
-- ===================================================================

-- Function to help users migrate their buckets to projects
CREATE OR REPLACE FUNCTION migrate_user_buckets_to_projects(p_user_id UUID)
RETURNS TABLE(
  bucket_id UUID,
  bucket_name TEXT,
  project_id UUID,
  project_name TEXT
) AS $$
BEGIN
  -- For each active bucket, check if a project with the same name exists
  -- If not, suggest creating one
  RETURN QUERY
  SELECT 
    b.id as bucket_id,
    b.name as bucket_name,
    p.id as project_id,
    p.title as project_name
  FROM buckets b
  LEFT JOIN projects p ON p.user_id = b.user_id 
    AND LOWER(TRIM(p.title)) = LOWER(TRIM(b.name))
  WHERE b.user_id = p_user_id
    AND b.is_archived = false
  ORDER BY b.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION migrate_user_buckets_to_projects IS 'Helper function to show users how their buckets map to projects';

-- ===================================================================
-- MIGRATION COMPLETE
-- ===================================================================
-- Users should manually create projects for their buckets
-- and update their study_sessions to reference the new project_id
-- ===================================================================
