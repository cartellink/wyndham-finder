-- Drop the existing function first
DROP FUNCTION IF EXISTS get_filtered_rooms(DATE, DATE, INT, INT, INT);
DROP FUNCTION IF EXISTS get_filtered_rooms(DATE, DATE, INT, INT, INT, INT, INT);

-- Recreate the function with hero_image_url field
CREATE OR REPLACE FUNCTION get_filtered_rooms(
    date_start DATE,
    date_end DATE,
    region_id INT DEFAULT NULL,
    stay_min INT DEFAULT 3,
    stay_max INT DEFAULT NULL,
    guest_min INT DEFAULT 1,
    max_credits INT DEFAULT NULL
)
RETURNS TABLE (
    room_id INT,
    room_name TEXT,
    resort_name TEXT,
    region_name TEXT,
    country TEXT,
    state TEXT,
    start_date DATE,
    end_date DATE,
    days_count INT,
    points INT,
    points_per_day FLOAT,
    hero_image_url TEXT
) AS $$
WITH date_diffs AS (
    SELECT 
        room_id,
        date,
        availability_status,
        point,
        ROW_NUMBER() OVER(PARTITION BY room_id ORDER BY date) - 
        EXTRACT(DAY FROM date)::INT AS date_group
    FROM availabilities 
    WHERE date BETWEEN date_start AND date_end
    AND availability_status >= 1
),

date_groups AS (
    SELECT 
        room_id,
        MIN(date) AS start_date,
        MAX(date) AS end_date,
        COUNT(*) as days_count,
        SUM(point) as points,
        date_group
    FROM date_diffs
    GROUP BY room_id, date_group
    HAVING COUNT(*) >= stay_min
    AND (stay_max IS NULL OR COUNT(*) <= stay_max)
)

SELECT 
    r.id AS room_id,
    r.name AS room_name,
    rs.name AS resort_name,
    reg.name AS region_name,
    rs.country,
    rs.state,
    dg.start_date,
    dg.end_date,
    dg.days_count,
    dg.points,
    FLOOR(dg.points / dg.days_count::FLOAT) AS points_per_day,
    mr.hero_image_url
FROM rooms r
JOIN resorts rs ON r.resort_id = rs.id
LEFT JOIN regions reg ON rs.region_id = reg.id
LEFT JOIN marketing_resorts mr ON rs.id = mr.resort_id
JOIN date_groups dg ON r.id = dg.room_id
WHERE (get_filtered_rooms.region_id IS NULL OR 
       EXISTS (
         SELECT 1 FROM regions target_reg 
         WHERE target_reg.id = get_filtered_rooms.region_id 
         AND rs.region_ids @> jsonb_build_array(target_reg.iris_id)
       ))
AND r.max_occupancy >= guest_min
AND (max_credits IS NULL OR dg.points <= max_credits)
ORDER BY reg.name, rs.name, r.name, dg.start_date;
$$ LANGUAGE sql; 