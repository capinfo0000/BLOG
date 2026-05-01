/*
  # Create comments table

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid) - Reference to posts table
      - `author_name` (text) - Commenter's display name
      - `content` (text) - Comment body
      - `ip_address` (text, nullable) - Reserved for future moderation
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Anonymous and authenticated users can INSERT comments only on published posts
    - Anyone can SELECT comments belonging to published posts
    - Admin users can SELECT/UPDATE/DELETE all comments
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view comments on published posts" ON comments;
DROP POLICY IF EXISTS "Public can insert comments on published posts" ON comments;
DROP POLICY IF EXISTS "Admin users can view all comments" ON comments;
DROP POLICY IF EXISTS "Admin users can update comments" ON comments;
DROP POLICY IF EXISTS "Admin users can delete comments" ON comments;

-- Anyone (anon + authenticated) can read comments belonging to a published post
CREATE POLICY "Public can view comments on published posts"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND posts.status = 'published'
    )
  );

-- Anyone can post a comment, but only on a published post
CREATE POLICY "Public can insert comments on published posts"
  ON comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND posts.status = 'published'
    )
    AND char_length(author_name) BETWEEN 1 AND 100
    AND char_length(content) BETWEEN 1 AND 2000
  );

-- Admin users can view all comments (including comments on drafts/archived posts)
CREATE POLICY "Admin users can view all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admin users can update comments (e.g. moderation)
CREATE POLICY "Admin users can update comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admin users can delete comments
CREATE POLICY "Admin users can delete comments"
  ON comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);
