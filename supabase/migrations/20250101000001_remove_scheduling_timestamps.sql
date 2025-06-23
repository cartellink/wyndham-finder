-- Remove scheduling-related columns from all tables
-- These columns were used for intelligent scraping but are no longer needed

-- Remove last_scraped_at columns from all tables
ALTER TABLE resorts DROP COLUMN IF EXISTS last_scraped_at;
ALTER TABLE rooms DROP COLUMN IF EXISTS last_scraped_at;  
ALTER TABLE availabilities DROP COLUMN IF EXISTS last_scraped_at;
ALTER TABLE marketing_resorts DROP COLUMN IF EXISTS last_scraped_at;

-- Note: We keep created_at and updated_at columns as they are useful for general record tracking
-- Note: We keep auth_sessions table as it's used for authentication, not scheduling
-- Note: We keep scraping_sessions table as it's used for 2FA authentication, not scheduling 