-- Command Center Schema Migration
-- Adds linked_domain column and migrates inbox tasks to backlog

-- Add domain linking column to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS linked_domain TEXT 
CHECK (linked_domain IN ('gym', 'study'));

-- Migrate all inbox tasks to backlog (consolidation)
UPDATE tasks 
SET status = 'backlog' 
WHERE status = 'inbox';

-- Optional: Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tasks_linked_domain ON tasks(linked_domain) 
WHERE linked_domain IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN tasks.linked_domain IS 'Links task to a specific domain (gym or study) for auto-start functionality';
