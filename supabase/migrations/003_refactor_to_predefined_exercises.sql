-- Refactor gym tables to use predefined exercises with integer IDs
-- This migration updates the schema to match the new predefined exercises approach

-- Step 1: Drop the old exercises table and related constraints
drop trigger if exists on_profile_created_seed_exercises on profiles;
drop function if exists seed_default_exercises();
drop table if exists workout_sets cascade;
drop table if exists personal_records cascade;
drop table if exists exercises cascade;

-- Step 2: Create new lifts table (replaces workout_sets)
create table lifts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  workout_id uuid references workouts on delete cascade not null,
  exercise_id int not null, -- Integer ID referencing predefined exercises
  set_number int not null,
  reps int not null,
  weight numeric(8, 2) not null,
  rpe int check (rpe >= 1 and rpe <= 10),
  created_at timestamptz default now() not null
);

alter table lifts enable row level security;
create policy "Users can manage own lifts" on lifts for all
  using (auth.uid() = user_id);
create index lifts_workout_idx on lifts(workout_id);
create index lifts_user_exercise_idx on lifts(user_id, exercise_id);

-- Step 3: Create new personal_records table with integer exercise_id and estimated_1rm
create table personal_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  exercise_id int not null, -- Integer ID referencing predefined exercises
  weight numeric(8, 2) not null,
  reps int not null,
  estimated_1rm numeric(8, 2) not null, -- New column for calculated 1RM
  date date not null,
  created_at timestamptz default now() not null,
  unique(user_id, exercise_id) -- Ensure only one PR per user per exercise
);

alter table personal_records enable row level security;
create policy "Users can manage own PRs" on personal_records for all using (auth.uid() = user_id);
create index prs_user_exercise_idx on personal_records(user_id, exercise_id);
