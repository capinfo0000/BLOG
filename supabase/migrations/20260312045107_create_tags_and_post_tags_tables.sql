/*
  # Create tags and post_tags tables

  1. New Tables
    - `tags`
      - `id` (uuid, primary key) - Unique identifier for each tag
      - `name` (text, unique) - Tag name
      - `slug` (text, unique) - URL-friendly version of tag name
      - `created_at` (timestamptz) - When the tag was created

    - `post_tags`
      - `post_id` (uuid) - Reference to posts table
      - `tag_id` (uuid) - Reference to tags table
      - `created_at` (timestamptz) - When the relationship was created
      - Primary key is (post_id, tag_id)

  2. Security
    - Enable RLS on both tables
    - Public can read all tags
    - Admin users can manage tags
    - Post tags inherit post visibility
*/

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

-- Enable RLS on tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Enable RLS on post_tags
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view all tags" ON tags;
DROP POLICY IF EXISTS "Admin users can insert tags" ON tags;
DROP POLICY IF EXISTS "Admin users can update tags" ON tags;
DROP POLICY IF EXISTS "Admin users can delete tags" ON tags;
DROP POLICY IF EXISTS "Public can view post tags for published posts" ON post_tags;
DROP POLICY IF EXISTS "Admin users can view all post tags" ON post_tags;
DROP POLICY IF EXISTS "Admin users can insert post tags" ON post_tags;
DROP POLICY IF EXISTS "Admin users can delete post tags" ON post_tags;

-- Tags policies
CREATE POLICY "Public can view all tags"
  ON tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin users can insert tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admin users can update tags"
  ON tags FOR UPDATE
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

CREATE POLICY "Admin users can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Post tags policies
CREATE POLICY "Public can view post tags for published posts"
  ON post_tags FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id
      AND posts.status = 'published'
    )
  );

CREATE POLICY "Admin users can view all post tags"
  ON post_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admin users can insert post tags"
  ON post_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admin users can delete post tags"
  ON post_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS tags_slug_idx ON tags(slug);
CREATE INDEX IF NOT EXISTS tags_name_idx ON tags(name);
CREATE INDEX IF NOT EXISTS post_tags_post_id_idx ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS post_tags_tag_id_idx ON post_tags(tag_id);