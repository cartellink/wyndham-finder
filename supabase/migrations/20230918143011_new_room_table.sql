CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name TEXT,
    "desc" TEXT,
    resort_id INT,
    consumption_entity JSONB,
    max_occupancy INT,
    online_bookable bool,
    allowed_program_tiers JSONB
);

CREATE TABLE availabilities (
    room_id INT REFERENCES rooms(id),
    date DATE NOT NULL,
    availability_status INT,
    point INT,
    season TEXT,
    PRIMARY KEY (room_id, date)
);
