/*
  # Fix admin profile INSERT policy

  1. Changes
    - Drop existing INSERT policy for profiles that prevents admins from creating other users' profiles
    - Create new INSERT policy that allows admins to create profiles for any user ID

  2. Security
    - Only admins can create new profiles
    - No restriction on which user ID the profile is created for (necessary for admin user creation)
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Create new INSERT policy that allows admins to create profiles for any user
CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
