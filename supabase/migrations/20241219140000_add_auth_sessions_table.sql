-- Add auth_sessions table for persistent cookie storage
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  cookies TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_valid BOOLEAN DEFAULT TRUE,
  user_agent TEXT
);

-- Add index for faster lookups by validity and expiration
CREATE INDEX IF NOT EXISTS idx_auth_sessions_valid_expires 
ON auth_sessions(is_valid, expires_at) 
WHERE is_valid = TRUE;

-- Add cleanup function to remove expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_auth_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth_sessions 
  WHERE expires_at < NOW() OR is_valid = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE auth_sessions IS 'Stores authentication sessions and cookies for the Wyndham scraper';
COMMENT ON COLUMN auth_sessions.cookies IS 'Serialized cookie jar data as JSON string';
COMMENT ON FUNCTION cleanup_expired_auth_sessions() IS 'Removes expired or invalid authentication sessions'; 