CREATE OR REPLACE FUNCTION get_filtered_rooms(
    dateStart DATE,
    dateEnd DATE,
    minOccupancy INT,
    minPoints INT,
    maxPoints INT
)
RETURNS TABLE (
    room_id INT,
    room_name TEXT,
    resort_name TEXT,
    country TEXT,
    state TEXT,
    start_date DATE,
    end_date DATE,
    days_count INT,
    points INT,
    points_per_day FLOAT
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
    WHERE date BETWEEN dateStart AND dateEnd
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
    HAVING COUNT(*) >= 3
)

SELECT 
    r.id AS room_id,
    r.name AS room_name,
    rs.name AS resort_name,
    rs.country,
    rs.state,
    dg.start_date,
    dg.end_date,
    dg.days_count,
    dg.points,
    FLOOR(dg.points / dg.days_count::FLOAT) AS points_per_day
FROM rooms r
JOIN resorts rs ON r.resort_id = rs.id
JOIN date_groups dg ON r.id = dg.room_id
WHERE r.max_occupancy >= minOccupancy
AND dg.points BETWEEN minPoints AND maxPoints
ORDER BY rs.state, rs.name, r.name, dg.start_date;
$$ LANGUAGE sql;
