-- Add timestamp columns to all tables for intelligent scraping
-- These columns will help us determine when to scrape different data types

-- Add columns to resorts table
ALTER TABLE resorts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;

-- Add columns to rooms table  
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;

-- Add columns to availabilities table
ALTER TABLE availabilities
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;

-- Create triggers to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for each table
CREATE TRIGGER update_resorts_updated_at 
    BEFORE UPDATE ON resorts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availabilities_updated_at 
    BEFORE UPDATE ON availabilities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create table to track 2FA sessions
CREATE TABLE IF NOT EXISTS scraping_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_type TEXT NOT NULL, -- 'resort', 'room', 'availability'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'awaiting_passcode', 'completed', 'failed'
    passcode_data JSONB, -- Store passcode email/phone data
    passcode_received TEXT, -- Store the actual passcode when received
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
    metadata JSONB -- Store any additional session data
);

-- Create index for efficient session lookups
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_status ON scraping_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_expires ON scraping_sessions(expires_at);

-- Create table for persistent authentication sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    cookies TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_valid BOOLEAN NOT NULL DEFAULT true,
    user_agent TEXT
);

-- Create trigger for auth_sessions updated_at
CREATE TRIGGER update_auth_sessions_updated_at 
    BEFORE UPDATE ON auth_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for efficient auth session lookups
CREATE INDEX IF NOT EXISTS idx_auth_sessions_valid ON auth_sessions(is_valid);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at); 