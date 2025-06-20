-- Create marketing_resorts table to store data scraped from the marketing website
CREATE TABLE marketing_resorts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    image_urls TEXT[], -- Array of gallery image URLs
    hero_image_url TEXT,
    excerpt TEXT,
    resort_id TEXT, -- The resortId from booking links
    slug TEXT,
    
    -- Matching information
    matched_resort_id INTEGER REFERENCES resorts(id),
    match_method TEXT CHECK (match_method IN ('resortId', 'name', 'slug', 'none')),
    match_confidence DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0 confidence score
    
    -- Additional metadata
    meta_description TEXT,
    og_title TEXT,
    og_description TEXT,
    additional_info JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_marketing_resorts_resort_id ON marketing_resorts(resort_id);
CREATE INDEX idx_marketing_resorts_matched_resort_id ON marketing_resorts(matched_resort_id);
CREATE INDEX idx_marketing_resorts_slug ON marketing_resorts(slug);
CREATE INDEX idx_marketing_resorts_name ON marketing_resorts USING gin(to_tsvector('english', name));
CREATE INDEX idx_marketing_resorts_last_scraped ON marketing_resorts(last_scraped_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketing_resorts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketing_resorts_updated_at
    BEFORE UPDATE ON marketing_resorts
    FOR EACH ROW
    EXECUTE FUNCTION update_marketing_resorts_updated_at();

-- Add comments for documentation
COMMENT ON TABLE marketing_resorts IS 'Marketing resort data scraped from the public website';
COMMENT ON COLUMN marketing_resorts.resort_id IS 'Resort ID extracted from booking links (maps to resorts.iris_id)';
COMMENT ON COLUMN marketing_resorts.matched_resort_id IS 'Foreign key to resorts table when matched';
COMMENT ON COLUMN marketing_resorts.match_method IS 'Method used to match with database resort (resortId, name, slug, none)';
COMMENT ON COLUMN marketing_resorts.match_confidence IS 'Confidence score for the match (0.0-1.0)';
COMMENT ON COLUMN marketing_resorts.additional_info IS 'Additional metadata stored as JSON'; 