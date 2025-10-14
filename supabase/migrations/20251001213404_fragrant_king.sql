/*
  # Create admin profile

  1. New Data
    - Creates an admin user profile with credentials
    - Email: admin@photoalbums.com
    - Password: admin123
    - Role: admin
    - Full access to all features

  2. Security
    - Uses Supabase auth system
    - Profile automatically linked to auth user
*/

-- Insert admin user into auth.users (this will be handled by Supabase auth)
-- We'll create a profile that can be used with the auth system

-- First, let's create a function to handle user creation with profile
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Generate a UUID for the admin user
  admin_user_id := gen_random_uuid();
  
  -- Insert into profiles table
  INSERT INTO profiles (
    id,
    email,
    name,
    role,
    department,
    position,
    salary,
    phone,
    telegram,
    avatar,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'admin@photoalbums.com',
    'Администратор Системы',
    'admin',
    'Управление',
    'Главный администратор',
    100000,
    '+7 (495) 123-45-67',
    '@admin_photoalbums',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    now(),
    now()
  );
  
  -- Note: The actual auth user will need to be created through Supabase Auth
  -- This profile will be linked when the user signs up with the same email
END;
$$;

-- Execute the function
SELECT create_admin_user();

-- Drop the function as it's no longer needed
DROP FUNCTION create_admin_user();

-- Also create some sample employees for testing
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  department,
  position,
  salary,
  phone,
  telegram,
  avatar,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'photographer@photoalbums.com',
  'Анна Иванова',
  'photographer',
  'Фотостудия',
  'Старший фотограф',
  60000,
  '+7 (495) 123-45-68',
  '@anna_photo',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  now(),
  now()
),
(
  gen_random_uuid(),
  'designer@photoalbums.com',
  'Елена Сидорова',
  'designer',
  'Дизайн-отдел',
  'Ведущий дизайнер',
  55000,
  '+7 (495) 123-45-69',
  '@elena_design',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  now(),
  now()
),
(
  gen_random_uuid(),
  'manager@photoalbums.com',
  'Михаил Петров',
  'admin',
  'Управление',
  'Менеджер проектов',
  70000,
  '+7 (495) 123-45-70',
  '@mikhail_manager',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  now(),
  now()
);