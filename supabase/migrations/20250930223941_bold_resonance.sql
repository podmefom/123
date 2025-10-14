/*
  # Create salary calculations table

  1. New Tables
    - `salary_calculations`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references profiles)
      - `project_type` (enum: individual, kindergarten, collective_11, collective_9, collective_4)
      - `info_collection_percent` (integer)
      - `photos_processed` (boolean)
      - `revisions_approved` (boolean)
      - `magazines_printed` (boolean)
      - `deadlines_met` (boolean)
      - `kr_magazines` (integer)
      - `calculated_salary` (decimal)
      - `payment_stages` (jsonb)
      - `month` (text)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `salary_calculations` table
    - Add policies for salary calculation access
*/

CREATE TABLE IF NOT EXISTS salary_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_type text NOT NULL CHECK (project_type IN ('individual', 'kindergarten', 'collective_11', 'collective_9', 'collective_4')),
  info_collection_percent integer NOT NULL DEFAULT 0,
  photos_processed boolean DEFAULT false,
  revisions_approved boolean DEFAULT false,
  magazines_printed boolean DEFAULT false,
  deadlines_met boolean DEFAULT true,
  kr_magazines integer DEFAULT 0,
  calculated_salary decimal(10,2) NOT NULL,
  payment_stages jsonb NOT NULL,
  month text NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE salary_calculations ENABLE ROW LEVEL SECURITY;

-- Policies for salary_calculations
CREATE POLICY "Admins can read all salary calculations"
  ON salary_calculations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can read their own salary calculations"
  ON salary_calculations
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can create salary calculations"
  ON salary_calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update salary calculations"
  ON salary_calculations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete salary calculations"
  ON salary_calculations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );