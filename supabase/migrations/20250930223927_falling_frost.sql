/*
  # Create comments table for project discussions

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `author_id` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `comments` table
    - Add policies based on project access
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
CREATE POLICY "Users can read comments for accessible projects"
  ON comments
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

CREATE POLICY "Users can create comments for accessible projects"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
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

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins can delete all comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );