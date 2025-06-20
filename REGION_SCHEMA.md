# Region Schema Documentation

## Overview

The region schema normalizes region data from the Wyndham website to provide consistent and reliable region information across the application. This replaces the previous approach of storing region data directly in the resorts table.

## Database Schema

### Regions Table

```sql
CREATE TABLE regions (
    id INT PRIMARY KEY,
    iris_id INT UNIQUE NOT NULL,           -- Original IRIS region ID from Wyndham
    name TEXT NOT NULL,                    -- Human-readable region name
    continent_code TEXT NOT NULL,          -- AP (Asia Pacific), NA (North America)
    country_code TEXT,                     -- AUS, USA, CAN, JPN, etc.
    sub_region TEXT,                       -- State/province/area within country
    parent_region_id INT REFERENCES regions(id), -- Hierarchical relationship
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Resort Table Updates

```sql
ALTER TABLE resorts ADD COLUMN region_id INT REFERENCES regions(id);
```

## Region Hierarchy

The regions are organized in a hierarchical structure:

### Asia Pacific (AP)
- **Australia (AUS)**
  - New South Wales
  - Queensland
  - South Australia
  - Sydney
  - Tasmania
  - Victoria
  - Western Australia
- **Japan (JPN)**
  - Chiba
  - Fukushima
  - Gunma
  - Kanagawa
  - Nagano
  - Sapporo
  - Shiga Kogen
  - Shizuoka
  - Tochigi
  - Yamanashi
- **New Zealand (NZL)**
- **South East Asia (SEA)**
  - Indonesia
  - Thailand
- **Europe (EUR)**
  - Bavaria
  - Normandy
  - Tuscany
- **Fiji (FJ)**
- **South Pacific (ANZ)**

### North America (NA)
- **Canada (CAN)**
- **Mexico (MEX)**
- **Caribbean (CAR)**
- **United States (USA)**
  - Anaheim
  - Arizona
  - Bass Lake/Northshore
  - California
  - Coastal Area
  - Colorado
  - Florida
  - Great Lakes
  - Hawaii
  - Idaho
  - Illinois
  - Louisiana
  - Mid West
  - Missouri
  - Montana
  - Mountain
  - Nevada
  - New Jersey
  - New Mexico
  - Northern California
  - Oklahoma
  - Oregon
  - South Carolina
  - Southern California
  - Tahoe
  - Tennessee
  - Texas
  - Tropical
  - Utah
  - Virginia
  - Washington
  - Wisconsin

## Usage

### TypeScript Models

```typescript
import { Region, fetchByContinent, fetchByCountry } from '@/lib/models/regions'
import { Resort, fetchByRegion } from '@/lib/models/resorts'

// Get all regions in Asia Pacific
const apRegions = await fetchByContinent('AP')

// Get all resorts in California
const californiaResorts = await fetchByRegion(36) // California region ID

// Get regions for a select dropdown
const regionOptions = await getRegionsForSelect()
```

### Region Mapping

The `mapRegionToId` utility function helps map region data from the scraper to the normalized regions:

```typescript
import { mapRegionToId } from '@/lib/utils'

const regionId = await mapRegionToId(
  '993',        // iris_id for California
  'USA',        // country code
  'California', // state
  'California'  // area name
)
```

## Migration Strategy

1. **Create regions table** with all region data from the HTML
2. **Add region_id foreign key** to resorts table
3. **Link existing resorts** to regions using the mapping function
4. **Update scrapers** to use the new region mapping
5. **Gradually deprecate** old region fields (region_code, country_code, etc.)

## Benefits

1. **Consistency**: All region data is normalized and consistent
2. **Reliability**: No more typos or variations in region names
3. **Hierarchy**: Clear parent-child relationships between regions
4. **Performance**: Efficient queries with proper indexing
5. **Maintainability**: Easy to add new regions or update existing ones
6. **Internationalization**: Clear continent and country codes for future i18n

## Future Enhancements

1. **Region translations** for multiple languages
2. **Region-specific settings** (time zones, currencies, etc.)
3. **Region-based filtering** in the UI
4. **Region analytics** and reporting
5. **Dynamic region loading** based on user location 