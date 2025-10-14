/*
  # Create projects table and related tables

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `title` (text)
      - `album_type` (text)
      - `description` (text, nullable)
      - `status` (enum: planning, in-progress, review, completed)
      - `manager_id` (uuid, references profiles)
      - `deadline` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `project_members`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid, references profiles)
      - `role` (enum: photographer, designer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for project access based on membership
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  album_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in-progress', 'review', 'completed')),
  manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  deadline date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('photographer', 'designer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id, role)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY "Users can read projects they are involved in"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all projects
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Managers can see their projects
    manager_id = auth.uid()
    OR
    -- Members can see projects they are assigned to
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin')
    )
  );

CREATE POLICY "Admins and managers can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR manager_id = auth.uid()
  );

CREATE POLICY "Admins can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for project_members
CREATE POLICY "Users can read project members for accessible projects"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members pm2 
          WHERE pm2.project_id = projects.id AND pm2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins and managers can manage project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR manager_id = auth.uid()
      )
    )
  );

-- Trigger to update updated_at on project changes
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();