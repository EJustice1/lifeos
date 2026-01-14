# Supabase Migration Instructions for Daily Context Reviews

## Problem
The `daily_context_reviews` table is missing from the database, causing 500 errors when trying to save daily context reviews.

## Solution
Run the following SQL in your Supabase SQL Editor:

```sql
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
```

## Alternative Approaches

### Option 1: Manual SQL Execution
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Paste and run the SQL above
4. Test the daily context review functionality

### Option 2: Use Existing Daily Reviews Table (Temporary Fix)
If you can't create the new table immediately, you can modify the daily context review to use the existing `daily_reviews` table by updating the server action:

```typescript
// In src/lib/actions/daily-context-review.ts
export async function submitDailyContextReview(
  date: string,
  executionScore: number,
  focusQuality: number,
  physicalVitality: number,
  frictionFactors: string[],
  lessonLearned: string | null,
  highlights: string | null,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Use the existing daily_reviews table instead
  const { error } = await supabase
    .from('daily_reviews')  // Changed from daily_context_reviews
    .upsert([{
      user_id: user.id,
      date: date,
      execution_score: executionScore,
      focus_quality: focusQuality,
      physical_vitality: physicalVitality,
      friction_factors: frictionFactors,
      lesson_learned: lessonLearned,
      highlights: highlights,
    }])

  if (error) {
    console.error('Supabase insert error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      table: error.table,
      column: error.column,
      constraint: error.constraint
    })
    throw error
  }

  return { success: true }
}
```

### Option 3: Mock Implementation for Development
If you need to test the UI without database access, you can create a mock server action:

```typescript
// In src/lib/actions/daily-context-review.ts (for development only)
export async function submitDailyContextReview(
  date: string,
  executionScore: number,
  focusQuality: number,
  physicalVitality: number,
  frictionFactors: string[],
  lessonLearned: string | null,
  highlights: string | null,
) {
  // Mock implementation for development
  console.log('Mock daily context review submission:', {
    date,
    executionScore,
    focusQuality,
    physicalVitality,
    frictionFactors,
    lessonLearned,
    highlights
  })

  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 500))

  return { success: true }
}
```

## Verification
After applying the migration, test the functionality:

1. Navigate to `/m/daily-context-review`
2. Fill out the daily context review form
3. Submit the form
4. Verify no 500 error occurs
5. Check the Supabase table to confirm data was saved

## Notes
- The migration file has been created at: `/supabase/migrations/005_create_daily_context_reviews_table.sql`
- The Supabase CLI is not working in this environment, so manual execution is required
- The code implementation is complete and ready to work once the database table exists