/*
  # Create calendar events table

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, nullable)
      - `event_date` (date)
      - `event_time` (time)
      - `event_type` (enum: meeting, photoshoot, design, deadline, other)
      - `created_by` (uuid, references profiles)
      - `project_id` (uuid, references projects, nullable)
      - `is_note` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `calendar_events` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time NOT NULL,
  event_type text NOT NULL DEFAULT 'other' CHECK (event_type IN ('meeting', 'photoshoot', 'design', 'deadline', 'other')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  is_note boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies for calendar_events
CREATE POLICY "Users can read all calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can update all events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete their own events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete all events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );