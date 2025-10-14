/*
  # Create messenger tables for internal communication

  1. New Tables
    - `chats`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chat_participants`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `user_id` (uuid, references profiles)
      - `joined_at` (timestamp)
      - `unread_count` (integer, default 0)
    
    - `messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `sender_id` (uuid, references profiles)
      - `content` (text, nullable)
      - `file_name` (text, nullable)
      - `file_type` (text, nullable)
      - `file_size` (bigint, nullable)
      - `file_url` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all messenger tables
    - Add policies for chat access based on participation
*/

CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  file_name text,
  file_type text,
  file_size bigint,
  file_url text,
  created_at timestamptz DEFAULT now(),
  CHECK (content IS NOT NULL OR file_url IS NOT NULL)
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for chats
CREATE POLICY "Users can read chats they participate in"
  ON chats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update chats they participate in"
  ON chats
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

-- Policies for chat_participants
CREATE POLICY "Users can read participants of their chats"
  ON chat_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp2 
      WHERE cp2.chat_id = chat_participants.chat_id AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to chats"
  ON chat_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own participation"
  ON chat_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for messages
CREATE POLICY "Users can read messages from their chats"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

-- Trigger to update chat updated_at when new message is sent
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET updated_at = now() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- Function to increment unread count for other participants
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_participants 
  SET unread_count = unread_count + 1 
  WHERE chat_id = NEW.chat_id AND user_id != NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_unread_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();