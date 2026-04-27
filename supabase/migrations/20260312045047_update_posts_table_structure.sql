/*
  # Update posts table structure

  1. Changes
    - Add `status` column to replace `published` boolean
    - Add `published_at` column for tracking publication time
    - Migrate existing data from `published` to `status`
    - Update RLS policies for the new structure

  2. Security
    - Update RLS policies to use status column
    - Maintain admin access control
*/

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE posts ADD COLUMN status text NOT NULL DEFAULT 'draft';
  END IF;
END $$;

-- Add published_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN published_at timestamptz;
  END IF;
END $$;

-- Migrate existing data: if published = true, set status to 'published'
UPDATE posts SET status = 'published' WHERE published = true AND status = 'draft';
UPDATE posts SET status = 'draft' WHERE published = false AND status != 'draft';

-- Set published_at for already published posts if not set
UPDATE posts SET published_at = created_at WHERE status = 'published' AND published_at IS NULL;

-- Add constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'posts_status_check'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END $$;

-- Drop old published column (optional - keep it for now for backwards compatibility)
-- ALTER TABLE posts DROP COLUMN IF EXISTS published;

-- Enable RLS (should already be enabled)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view published posts" ON posts;
DROP POLICY IF EXISTS "Admin users can view all posts" ON posts;
DROP POLICY IF EXISTS "Admin users can insert posts" ON posts;
DROP POLICY IF EXISTS "Admin users can update posts" ON posts;
DROP POLICY IF EXISTS "Admin users can delete posts" ON posts;

-- Public can read published posts
CREATE POLICY "Public can view published posts"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admin users can view all posts
CREATE POLICY "Admin users can view all posts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admin users can insert posts
CREATE POLICY "Admin users can insert posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admin users can update posts
CREATE POLICY "Admin users can update posts"
  ON posts FOR UPDATE
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

-- Admin users can delete posts
CREATE POLICY "Admin users can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create index for faster status queries if it doesn't exist
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);

-- Create index for faster published_at queries if it doesn't exist
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at DESC);

-- Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;

-- Trigger to call the function
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();