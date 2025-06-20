-- Create regions table to normalize region data
CREATE TABLE regions (
    id INT PRIMARY KEY,
    iris_id INT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    continent_code TEXT NOT NULL, -- AP, NA, etc.
    country_code TEXT, -- AUS, USA, CAN, etc.
    sub_region TEXT, -- New South Wales, California, etc.
    parent_region_id INT REFERENCES regions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for efficient lookups
CREATE INDEX idx_regions_iris_id ON regions(iris_id);
CREATE INDEX idx_regions_continent_country ON regions(continent_code, country_code);
CREATE INDEX idx_regions_parent_id ON regions(parent_region_id);

-- Add region_id foreign key to resorts table
ALTER TABLE resorts ADD COLUMN region_id INT REFERENCES regions(id);

-- Create index for the foreign key
CREATE INDEX idx_resorts_region_id ON resorts(region_id);

-- Insert the regions from the HTML data
INSERT INTO regions (id, iris_id, name, continent_code, country_code, sub_region) VALUES
-- Asia Pacific (AP) regions
(1, 690, 'South Pacific', 'AP', 'ANZ', NULL),
(2, 686, 'Australia', 'AP', 'AUS', NULL),
(3, 687, 'New South Wales', 'AP', 'AUS', 'New South Wales'),
(4, 689, 'Queensland', 'AP', 'AUS', 'Queensland'),
(5, 60886, 'South Australia', 'AP', 'AUS', 'South Australia'),
(6, 60987, 'Sydney', 'AP', 'AUS', 'Sydney'),
(7, 3387, 'Tasmania', 'AP', 'AUS', 'Tasmania'),
(8, 692, 'Victoria', 'AP', 'AUS', 'Victoria'),
(9, 57890, 'Western Australia', 'AP', 'AUS', 'Western Australia'),
(10, 60627, 'Bavaria', 'AP', 'EUR', 'Bavaria'),
(11, 60652, 'Normandy', 'AP', 'EUR', 'Normandy'),
(12, 60626, 'Tuscany', 'AP', 'EUR', 'Tuscany'),
(13, 60526, 'Fiji', 'AP', 'FJ', NULL),
(14, 60674, 'Chiba', 'AP', 'JPN', 'Chiba'),
(15, 60672, 'Fukushima', 'AP', 'JPN', 'Fukushima'),
(16, 60668, 'Gunma', 'AP', 'JPN', 'Gunma'),
(17, 60666, 'Japan', 'AP', 'JPN', NULL),
(18, 60670, 'Kanagawa', 'AP', 'JPN', 'Kanagawa'),
(19, 60669, 'Nagano', 'AP', 'JPN', 'Nagano'),
(20, 60866, 'Sapporo', 'AP', 'JPN', 'Sapporo'),
(21, 61006, 'Shiga Kogen', 'AP', 'JPN', 'Shiga Kogen'),
(22, 60675, 'Shizuoka', 'AP', 'JPN', 'Shizuoka'),
(23, 60673, 'Tochigi', 'AP', 'JPN', 'Tochigi'),
(24, 60667, 'Yamanashi', 'AP', 'JPN', 'Yamanashi'),
(25, 688, 'New Zealand', 'AP', 'NZL', NULL),
(26, 57287, 'Indonesia', 'AP', 'SEA', 'Indonesia'),
(27, 60346, 'South East Asia', 'AP', 'SEA', NULL),
(28, 60527, 'Thailand', 'AP', 'SEA', 'Thailand'),
(29, 60447, 'Hawaii', 'AP', 'USA', 'Hawaii'),

-- North America (NA) regions
(30, 994, 'Canada', 'NA', 'CAN', NULL),
(31, 60186, 'Caribbean', 'NA', 'CAR', NULL),
(32, 1002, 'Mexico', 'NA', 'MEX', NULL),
(33, 986, 'Anaheim', 'NA', 'USA', 'Anaheim'),
(34, 987, 'Arizona', 'NA', 'USA', 'Arizona'),
(35, 992, 'Bass Lake/Northshore', 'NA', 'USA', 'Bass Lake/Northshore'),
(36, 993, 'California', 'NA', 'USA', 'California'),
(37, 995, 'Coastal Area', 'NA', 'USA', 'Coastal Area'),
(38, 996, 'Colorado', 'NA', 'USA', 'Colorado'),
(39, 997, 'Florida', 'NA', 'USA', 'Florida'),
(40, 998, 'Great Lakes', 'NA', 'USA', 'Great Lakes'),
(41, 1000, 'Hawaii', 'NA', 'USA', 'Hawaii'),
(42, 1001, 'Idaho', 'NA', 'USA', 'Idaho'),
(43, 58786, 'Illinois', 'NA', 'USA', 'Illinois'),
(44, 2788, 'Louisiana', 'NA', 'USA', 'Louisiana'),
(45, 1003, 'Mid West', 'NA', 'USA', 'Mid West'),
(46, 1004, 'Missouri', 'NA', 'USA', 'Missouri'),
(47, 60067, 'Montana', 'NA', 'USA', 'Montana'),
(48, 60066, 'Mountain', 'NA', 'USA', 'Mountain'),
(49, 2486, 'Nevada', 'NA', 'USA', 'Nevada'),
(50, 60148, 'New Jersey', 'NA', 'USA', 'New Jersey'),
(51, 58186, 'New Mexico', 'NA', 'USA', 'New Mexico'),
(52, 60587, 'North America', 'NA', 'USA', NULL),
(53, 1005, 'Northern California', 'NA', 'USA', 'Northern California'),
(54, 59088, 'Oklahoma', 'NA', 'USA', 'Oklahoma'),
(55, 1006, 'Oregon', 'NA', 'USA', 'Oregon'),
(56, 59390, 'South Carolina', 'NA', 'USA', 'South Carolina'),
(57, 1007, 'Southern California', 'NA', 'USA', 'Southern California'),
(58, 1008, 'Tahoe', 'NA', 'USA', 'Tahoe'),
(59, 58486, 'Tennessee', 'NA', 'USA', 'Tennessee'),
(60, 58187, 'Texas', 'NA', 'USA', 'Texas'),
(61, 1009, 'Tropical', 'NA', 'USA', 'Tropical'),
(62, 1010, 'Utah', 'NA', 'USA', 'Utah'),
(63, 59388, 'Virginia', 'NA', 'USA', 'Virginia'),
(64, 1011, 'Washington', 'NA', 'USA', 'Washington'),
(65, 59386, 'Wisconsin', 'NA', 'USA', 'Wisconsin');

-- Update parent_region_id for sub-regions
UPDATE regions SET parent_region_id = 2 WHERE continent_code = 'AP' AND country_code = 'AUS' AND sub_region IS NOT NULL;
UPDATE regions SET parent_region_id = 17 WHERE continent_code = 'AP' AND country_code = 'JPN' AND sub_region IS NOT NULL;
UPDATE regions SET parent_region_id = 27 WHERE continent_code = 'AP' AND country_code = 'SEA' AND sub_region IS NOT NULL;
UPDATE regions SET parent_region_id = 52 WHERE continent_code = 'NA' AND country_code = 'USA' AND sub_region IS NOT NULL; 