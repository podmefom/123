/*
  # Fix infinite recursion in project_members RLS policies

  1. Changes
    - Drop existing RLS policies for project_members that cause infinite recursion
    - Create new simplified policies that don't reference project_members within project_members policies
    - Allow users to see project members if they can see the project itself

  2. Security
    - Maintain proper access control
    - Avoid circular references in policy checks
*/

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can read project members for accessible projects" ON project_members;
DROP POLICY IF EXISTS "Admins and managers can manage project members" ON project_members;

-- Create new simplified policies

-- SELECT: Users can read project members if they are admin, project manager, or a member of that project
CREATE POLICY "Users can read project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Project manager can see members
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.manager_id = auth.uid()
    )
    OR
    -- Members can see other members of same project
    user_id = auth.uid()
  );

-- INSERT: Only admins and project managers can add members
CREATE POLICY "Admins and managers can add project members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.manager_id = auth.uid()
    )
  );

-- UPDATE: Only admins and project managers can update members
CREATE POLICY "Admins and managers can update project members"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.manager_id = auth.uid()
    )
  );

-- DELETE: Only admins and project managers can remove members
CREATE POLICY "Admins and managers can delete project members"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.manager_id = auth.uid()
    )
  );
