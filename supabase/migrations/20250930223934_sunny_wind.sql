/*
  # Create reports table for employee reports

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, nullable)
      - `file_name` (text)
      - `file_type` (text)
      - `file_size` (bigint)
      - `file_url` (text)
      - `uploaded_by` (uuid, references profiles)
      - `uploaded_at` (timestamp)

  2. Security
    - Enable RLS on `reports` table
    - Add policies for report access
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies for reports
CREATE POLICY "Admins can read all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can read their own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can update all reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete their own reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can delete all reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );