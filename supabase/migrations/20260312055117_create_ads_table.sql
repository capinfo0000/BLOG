/*
  # Create ads table for managing site advertisements

  1. New Tables
    - `ads`
      - `id` (uuid, primary key)
      - `sidebar_ad` (text, nullable) - HTML content for sidebar advertisement
      - `banner_ad` (text, nullable) - HTML content for banner advertisement
      - `updated_at` (timestamptz) - Last update timestamp
      - `updated_by` (uuid, nullable) - References auth.users

  2. Security
    - Enable RLS on `ads` table
    - Add policy for public read access (anyone can view ads)
    - Add policy for authenticated admin users to update ads

  3. Initial Data
    - Insert a single row with id = '00000000-0000-0000-0000-000000000001' for singleton pattern
*/

CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sidebar_ad text,
  banner_ad text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ads"
  ON ads
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update ads"
  ON ads
  FOR UPDATE
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

-- Insert initial row with fixed ID for singleton pattern
INSERT INTO ads (id, sidebar_ad, banner_ad)
VALUES ('00000000-0000-0000-0000-000000000001', null, null)
ON CONFLICT (id) DO NOTHING;