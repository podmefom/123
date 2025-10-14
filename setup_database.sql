/*
  # Complete Schema Setup for Graduation Journal Management System

  INSTRUCTIONS:
  1. Go to your Supabase Dashboard: https://supabase.com/dashboard
  2. Select your project
  3. Go to SQL Editor
  4. Copy and paste this entire file
  5. Click "Run" to execute

  This will create all tables, RLS policies, and triggers needed for the application.
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('photographer', 'designer', 'admin')),
  department text,
  position text,
  salary integer,
  phone text,
  telegram text,
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  album_type text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('planning', 'in_progress', 'review', 'completed')),
  manager_id uuid REFERENCES profiles(id),
  deadline date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('photographer', 'designer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  file_url text NOT NULL,
  preview_url text,
  uploaded_by uuid REFERENCES profiles(id),
  uploaded_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('project_summary', 'employee_performance', 'financial', 'time_tracking', 'custom')),
  description text,
  created_by uuid NOT NULL REFERENCES profiles(id),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drop existing project policies
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Admins can read all projects" ON projects;
DROP POLICY IF EXISTS "Managers and admins can insert projects" ON projects;
DROP POLICY IF EXISTS "Managers and admins can update projects" ON projects;
DROP POLICY IF EXISTS "Managers and admins can delete projects" ON projects;

-- Projects policies
CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers and admins can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers and admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers and admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drop existing project_members policies
DROP POLICY IF EXISTS "Users can read project members for their projects" ON project_members;
DROP POLICY IF EXISTS "Managers and admins can manage project members" ON project_members;

-- Project members policies
CREATE POLICY "Users can read project members for their projects"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    ) OR
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers and admins can manage project members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drop existing project_files policies
DROP POLICY IF EXISTS "Users can read files for their projects" ON project_files;
DROP POLICY IF EXISTS "Users can upload files to their projects" ON project_files;
DROP POLICY IF EXISTS "Users can delete files from their projects" ON project_files;

-- Project files policies
CREATE POLICY "Users can read files for their projects"
  ON project_files FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    ) OR
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can upload files to their projects"
  ON project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    ) OR
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete files from their projects"
  ON project_files FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drop existing messages policies
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update own received messages" ON messages;

-- Messages policies
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Drop existing reports policies
DROP POLICY IF EXISTS "Users can read own reports" ON reports;
DROP POLICY IF EXISTS "Admins can read all reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

-- Reports policies
CREATE POLICY "Users can read own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    ) OR
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update all reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own reports"
  ON reports FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete all reports"
  ON reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger function for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'photographer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema setup completed successfully!';
  RAISE NOTICE 'You can now use the application.';
END $$;
