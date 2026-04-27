/*
  # Create admin users table

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key) - references auth.users
      - `email` (text) - admin email
      - `created_at` (timestamptz) - when admin was created
  
  2. Security
    - Enable RLS on `admin_users` table
    - Add policy for admins to read their own data
    - Add policy for checking if user is admin
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone can check if user is admin"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);
