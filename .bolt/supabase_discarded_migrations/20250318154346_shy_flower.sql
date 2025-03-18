/*
  # Project Management Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `nom` (text)
      - `description` (text)
      - `progression` (integer)
      - `date_limite` (date)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

    - `phases`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `nom` (text)
      - `date_debut` (date)
      - `date_fin` (date)
      - `created_at` (timestamp with time zone)

    - `tasks`
      - `id` (uuid, primary key)
      - `phase_id` (uuid, foreign key to phases)
      - `titre` (text)
      - `complete` (boolean)
      - `date_debut` (date)
      - `date_fin` (date)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS phases;
DROP TABLE IF EXISTS projects;

-- Create projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  progression integer DEFAULT 0,
  date_limite date NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create phases table
CREATE TABLE phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  nom text NOT NULL,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid REFERENCES phases(id) ON DELETE CASCADE,
  titre text NOT NULL,
  complete boolean DEFAULT false,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Users can create their own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for phases
CREATE POLICY "Users can manage phases of their projects"
  ON phases
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = phases.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policies for tasks
CREATE POLICY "Users can manage tasks of their projects"
  ON tasks
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM phases
      JOIN projects ON projects.id = phases.project_id
      WHERE phases.id = tasks.phase_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create function to update project progression
CREATE OR REPLACE FUNCTION update_project_progression()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET progression = (
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN t.complete THEN 1 END)::float / NULLIF(COUNT(*), 0)::float) * 100
      ),
      0
    )
    FROM tasks t
    JOIN phases p ON p.id = t.phase_id
    WHERE p.project_id = (
      SELECT project_id FROM phases WHERE id = NEW.phase_id
    )
  ),
  updated_at = now()
  WHERE id = (
    SELECT project_id FROM phases WHERE id = NEW.phase_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_project_progression_trigger ON tasks;

-- Create trigger to update project progression
CREATE TRIGGER update_project_progression_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_project_progression();