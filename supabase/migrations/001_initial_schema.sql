-- LifeOS Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  display_name text,
  timezone text default 'America/New_York' not null
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ===================
-- FINANCIAL MODULE
-- ===================

-- Accounts
create table accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now() not null,
  name text not null,
  type text check (type in ('cash', 'checking', 'savings', 'investment', 'crypto', 'other')) not null,
  balance numeric(15, 2) default 0 not null,
  currency text default 'USD' not null,
  is_active boolean default true not null
);

alter table accounts enable row level security;
create policy "Users can manage own accounts" on accounts for all using (auth.uid() = user_id);
create index accounts_user_id_idx on accounts(user_id);

-- Transactions
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references accounts on delete set null,
  created_at timestamptz default now() not null,
  date date not null,
  type text check (type in ('income', 'expense', 'transfer')) not null,
  amount numeric(15, 2) not null,
  category text not null,
  description text
);

alter table transactions enable row level security;
create policy "Users can manage own transactions" on transactions for all using (auth.uid() = user_id);
create index transactions_user_id_date_idx on transactions(user_id, date desc);

-- Net Worth Snapshots
create table net_worth_snapshots (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  total_assets numeric(15, 2) not null,
  total_cash numeric(15, 2) not null,
  total_investments numeric(15, 2) not null,
  unique(user_id, date)
);

alter table net_worth_snapshots enable row level security;
create policy "Users can manage own snapshots" on net_worth_snapshots for all using (auth.uid() = user_id);
create index net_worth_user_date_idx on net_worth_snapshots(user_id, date desc);

-- ===================
-- GYM MODULE
-- ===================

-- Exercises
create table exercises (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text check (category in ('push', 'pull', 'legs', 'core', 'cardio', 'other')) not null,
  is_compound boolean default false not null,
  created_at timestamptz default now() not null
);

alter table exercises enable row level security;
create policy "Users can manage own exercises" on exercises for all using (auth.uid() = user_id);
create index exercises_user_id_idx on exercises(user_id);

-- Workouts
create table workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  type text,
  notes text,
  total_volume numeric(12, 2) default 0 not null
);

alter table workouts enable row level security;
create policy "Users can manage own workouts" on workouts for all using (auth.uid() = user_id);
create index workouts_user_date_idx on workouts(user_id, date desc);

-- Workout Sets
create table workout_sets (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references workouts on delete cascade not null,
  exercise_id uuid references exercises on delete cascade not null,
  set_number int not null,
  reps int not null,
  weight numeric(8, 2) not null,
  rpe int check (rpe >= 1 and rpe <= 10),
  created_at timestamptz default now() not null
);

alter table workout_sets enable row level security;
create policy "Users can manage own sets" on workout_sets for all
  using (exists (select 1 from workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid()));
create index workout_sets_workout_idx on workout_sets(workout_id);

-- Personal Records
create table personal_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  exercise_id uuid references exercises on delete cascade not null,
  weight numeric(8, 2) not null,
  reps int not null,
  date date not null,
  created_at timestamptz default now() not null
);

alter table personal_records enable row level security;
create policy "Users can manage own PRs" on personal_records for all using (auth.uid() = user_id);
create index prs_user_exercise_idx on personal_records(user_id, exercise_id);

-- ===================
-- CAREER MODULE
-- ===================

-- Buckets (classes, projects, etc.)
create table buckets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text check (type in ('class', 'lab', 'project', 'work', 'other')) not null,
  color text default '#3b82f6' not null,
  is_archived boolean default false not null,
  created_at timestamptz default now() not null
);

alter table buckets enable row level security;
create policy "Users can manage own buckets" on buckets for all using (auth.uid() = user_id);
create index buckets_user_id_idx on buckets(user_id);

-- Study Sessions
create table study_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  bucket_id uuid references buckets on delete cascade not null,
  date date not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes int default 0 not null,
  notes text
);

alter table study_sessions enable row level security;
create policy "Users can manage own sessions" on study_sessions for all using (auth.uid() = user_id);
create index study_sessions_user_date_idx on study_sessions(user_id, date desc);

-- ===================
-- DIGITAL WELLBEING MODULE
-- ===================

-- Screen Time (daily aggregates)
create table screen_time (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  productive_minutes int default 0 not null,
  distracted_minutes int default 0 not null,
  mobile_minutes int default 0 not null,
  desktop_minutes int default 0 not null,
  source text check (source in ('rescuetime', 'manual')) default 'manual' not null,
  synced_at timestamptz default now() not null,
  unique(user_id, date)
);

alter table screen_time enable row level security;
create policy "Users can manage own screen time" on screen_time for all using (auth.uid() = user_id);
create index screen_time_user_date_idx on screen_time(user_id, date desc);

-- App Usage (detailed breakdown)
create table app_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  app_name text not null,
  category text check (category in ('productive', 'neutral', 'distracted')) not null,
  minutes int not null
);

alter table app_usage enable row level security;
create policy "Users can manage own app usage" on app_usage for all using (auth.uid() = user_id);
create index app_usage_user_date_idx on app_usage(user_id, date desc);

-- ===================
-- DAILY REVIEW MODULE
-- ===================

-- Daily Reviews
create table daily_reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  mood int check (mood >= 1 and mood <= 10) not null,
  energy int check (energy >= 1 and energy <= 10) not null,
  perceived_success int check (perceived_success >= 1 and perceived_success <= 10) not null,
  wins text,
  improvements text,
  tags text[] default '{}' not null,
  created_at timestamptz default now() not null,
  unique(user_id, date)
);

alter table daily_reviews enable row level security;
create policy "Users can manage own reviews" on daily_reviews for all using (auth.uid() = user_id);
create index daily_reviews_user_date_idx on daily_reviews(user_id, date desc);

-- ===================
-- SEED DEFAULT EXERCISES
-- ===================

-- This function seeds default exercises for new users
create or replace function seed_default_exercises()
returns trigger as $$
begin
  insert into exercises (user_id, name, category, is_compound) values
    (new.id, 'Bench Press', 'push', true),
    (new.id, 'Incline Dumbbell Press', 'push', true),
    (new.id, 'Overhead Press', 'push', true),
    (new.id, 'Tricep Pushdown', 'push', false),
    (new.id, 'Lateral Raise', 'push', false),
    (new.id, 'Deadlift', 'pull', true),
    (new.id, 'Barbell Row', 'pull', true),
    (new.id, 'Pull-up', 'pull', true),
    (new.id, 'Lat Pulldown', 'pull', false),
    (new.id, 'Bicep Curl', 'pull', false),
    (new.id, 'Face Pull', 'pull', false),
    (new.id, 'Squat', 'legs', true),
    (new.id, 'Leg Press', 'legs', true),
    (new.id, 'Romanian Deadlift', 'legs', true),
    (new.id, 'Leg Extension', 'legs', false),
    (new.id, 'Leg Curl', 'legs', false),
    (new.id, 'Calf Raise', 'legs', false),
    (new.id, 'Plank', 'core', false),
    (new.id, 'Cable Crunch', 'core', false);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_seed_exercises
  after insert on profiles
  for each row execute procedure seed_default_exercises();
