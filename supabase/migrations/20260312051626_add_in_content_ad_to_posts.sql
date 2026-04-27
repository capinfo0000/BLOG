/*
  # Add in-content advertisement field to posts

  1. Changes
    - Add `in_content_ad` column to posts table for storing advertisement HTML or embed code
    - Column is nullable to allow posts without ads
    - Text data type to store HTML/embed code

  2. Notes
    - Admins can optionally add custom advertisement content per post
    - If null, default placeholder will be shown on frontend
*/

-- Add in_content_ad column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'in_content_ad'
  ) THEN
    ALTER TABLE posts ADD COLUMN in_content_ad text;
  END IF;
END $$;