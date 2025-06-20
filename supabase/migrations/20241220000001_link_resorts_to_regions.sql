-- Link existing resorts to regions based on their current data
-- This is a mapping based on the region codes and country codes in the existing data

-- Update resorts to link to regions based on country_code and region_code
UPDATE resorts 
SET region_id = (
  SELECT r.id 
  FROM regions r 
  WHERE r.country_code = resorts.country_code 
  AND r.sub_region IS NULL
  LIMIT 1
)
WHERE region_id IS NULL 
AND country_code IS NOT NULL;

-- For resorts with specific region codes, try to match more precisely
UPDATE resorts 
SET region_id = (
  SELECT r.id 
  FROM regions r 
  WHERE r.iris_id::text = resorts.region_code
  LIMIT 1
)
WHERE region_id IS NULL 
AND region_code IS NOT NULL 
AND region_code != '';

-- For resorts with state information, try to match by sub_region
UPDATE resorts 
SET region_id = (
  SELECT r.id 
  FROM regions r 
  WHERE r.country_code = resorts.country_code 
  AND r.sub_region = resorts.state
  LIMIT 1
)
WHERE region_id IS NULL 
AND state IS NOT NULL 
AND state != '';

-- For resorts with area_name that matches region names
UPDATE resorts 
SET region_id = (
  SELECT r.id 
  FROM regions r 
  WHERE r.name ILIKE '%' || resorts.area_name || '%'
  OR resorts.area_name ILIKE '%' || r.name || '%'
  LIMIT 1
)
WHERE region_id IS NULL 
AND area_name IS NOT NULL 
AND area_name != '';

-- Create a function to help with future region mapping
CREATE OR REPLACE FUNCTION map_resort_to_region(
  p_country_code TEXT,
  p_region_code TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_area_name TEXT DEFAULT NULL
) RETURNS INT AS $$
DECLARE
  region_id INT;
BEGIN
  -- Try to match by iris_id first
  IF p_region_code IS NOT NULL AND p_region_code != '' THEN
    SELECT id INTO region_id 
    FROM regions 
    WHERE iris_id::text = p_region_code;
    
    IF region_id IS NOT NULL THEN
      RETURN region_id;
    END IF;
  END IF;
  
  -- Try to match by country and state
  IF p_country_code IS NOT NULL AND p_state IS NOT NULL THEN
    SELECT id INTO region_id 
    FROM regions 
    WHERE country_code = p_country_code 
    AND sub_region = p_state;
    
    IF region_id IS NOT NULL THEN
      RETURN region_id;
    END IF;
  END IF;
  
  -- Try to match by country only (parent region)
  IF p_country_code IS NOT NULL THEN
    SELECT id INTO region_id 
    FROM regions 
    WHERE country_code = p_country_code 
    AND sub_region IS NULL;
    
    IF region_id IS NOT NULL THEN
      RETURN region_id;
    END IF;
  END IF;
  
  -- Try to match by area name
  IF p_area_name IS NOT NULL THEN
    SELECT id INTO region_id 
    FROM regions 
    WHERE name ILIKE '%' || p_area_name || '%'
    OR p_area_name ILIKE '%' || name || '%';
    
    IF region_id IS NOT NULL THEN
      RETURN region_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql; 