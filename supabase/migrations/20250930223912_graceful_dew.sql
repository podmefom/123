/*
  # Create project files table

  1. New Tables
    - `project_files`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text)
      - `file_type` (text)
      - `file_size` (bigint)
      - `preview_url` (text, nullable)
      - `file_url` (text)
      - `uploaded_by` (uuid, references profiles)
      - `uploaded_at` (timestamp)

  2. Security
    - Enable RLS on `project_files` table
    - Add policies based on project access
*/

CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  preview_url text,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Policies for project_files
CREATE POLICY "Users can read files for accessible projects"
  ON project_files
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
          SELECT 1 FROM project_members 
          WHERE project_id = projects.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can upload files to accessible projects"
  ON project_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_id = projects.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete files from accessible projects"
  ON project_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR manager_id = auth.uid()
        OR uploaded_by = auth.uid()
      )
    )
  );