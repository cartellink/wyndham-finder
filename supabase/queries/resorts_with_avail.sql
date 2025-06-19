SELECT DISTINCT 
    r.id,
    r.name,
    r.country_code,
    r.region_code,
    r.area_name,
    COUNT(DISTINCT rm.id) as total_rooms,
    COUNT(a.room_id) as total_availability_records,
    MIN(a.date) as earliest_availability_date,
    MAX(a.date) as latest_availability_date
FROM resorts r
INNER JOIN rooms rm ON r.id = rm.resort_id
INNER JOIN availabilities a ON rm.id = a.room_id
GROUP BY r.id, r.name, r.country_code, r.region_code, r.area_name
ORDER BY r.name;