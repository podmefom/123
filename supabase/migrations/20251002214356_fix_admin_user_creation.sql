/*
  # Fix admin user creation

  1. Changes
    - Remove invalid profile inserts that violate foreign key constraints
    - The profiles should only be created when actual auth users are created
    - Users must sign up through Supabase Auth to get valid entries in auth.users
    - Profiles will be automatically created via the handle_new_user() trigger

  2. Notes
    - To create an admin user, sign up with email/password through the app
    - Then manually update the role to 'admin' in the profiles table
    - Or use the Supabase dashboard to create users and their profiles
*/

-- Remove the problematic function and data inserts from previous migration
-- This migration essentially cleans up the invalid approach

-- The correct way to create users is:
-- 1. Use Supabase Auth to create users (via signup)
-- 2. The trigger will automatically create profiles
-- 3. Update the role if needed

-- Note: If you need to create an initial admin user, use the Supabase dashboard
-- or create an Edge Function that uses the service role to create auth users
