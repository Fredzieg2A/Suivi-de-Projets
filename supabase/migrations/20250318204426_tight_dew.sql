/*
  # Add budget fields to projects and phases

  1. Changes
    - Add budget column to projects table
    - Add budget column to phases table
    
  2. Notes
    - Using numeric type for precise decimal calculations
    - Default value of 0 for both fields
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'budget'
  ) THEN
    ALTER TABLE projects ADD COLUMN budget numeric(10,2) DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'phases' AND column_name = 'budget'
  ) THEN
    ALTER TABLE phases ADD COLUMN budget numeric(10,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;