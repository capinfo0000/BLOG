/*
  # Fix admin_users table

  1. Changes
    - Drop the existing admin_users table
    - Recreate without foreign key constraint to auth.users
    - Use uuid type for id that matches auth user id
  
  2. Security
    - Enable RLS on `admin_users` table
    - Add policy for admins to read their own data
    - Add policy for checking if user is admin
*/

DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone authenticated can check if user is admin"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);
