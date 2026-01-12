-- Fix profile insert policy and improve trigger error handling
-- This migration adds an INSERT policy for profiles and improves the trigger function

-- Add INSERT policy for profiles (allows trigger to insert)
-- Note: The trigger uses security definer, but having an explicit policy is safer
create policy "System can insert profiles" on profiles
  for insert
  with check (true);

-- Improve the handle_new_user function with better error handling
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing; -- Prevent duplicate inserts if trigger fires twice
  return new;
exception
  when others then
    -- Log the error but don't fail the user creation
    raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$ language plpgsql security definer;


