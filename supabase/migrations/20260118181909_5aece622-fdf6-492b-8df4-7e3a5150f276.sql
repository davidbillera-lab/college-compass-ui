-- Drop the existing unique constraint on name only
ALTER TABLE colleges DROP CONSTRAINT IF EXISTS colleges_name_key;

-- Create a new unique constraint on name + city + state combination
-- This allows colleges with the same name in different cities/states
CREATE UNIQUE INDEX IF NOT EXISTS colleges_name_city_state_unique 
ON colleges (name, COALESCE(city, ''), COALESCE(state, ''));