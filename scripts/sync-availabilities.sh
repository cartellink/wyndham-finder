#!/bin/bash

# Simple script to sync availabilities from local to production
set -e

# Configuration
LOCAL_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DUMP_FILE="availabilities.sql"

# Check if production DB URL is set
if [ -z "$PROD_SUPABASE_DB_URL" ]; then
    echo "Error: PROD_SUPABASE_DB_URL environment variable is required"
    echo "Example: export PROD_SUPABASE_DB_URL=\"postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres\""
    exit 1
fi

echo "Dumping availabilities from local database..."
# Use docker to run pg_dump with the correct PostgreSQL version
# Removed --inserts flag to use COPY format (much faster)
docker run --rm --network host -v "$(pwd):/workspace" postgres:17 \
    pg_dump "$LOCAL_DB_URL" \
    --table=availabilities \
    --data-only \
    --no-owner \
    --no-privileges \
    --file="/workspace/$DUMP_FILE"

# echo "Truncating availabilities table in production..."
# psql "$PROD_SUPABASE_DB_URL" -c "TRUNCATE TABLE availabilities RESTART IDENTITY CASCADE;"

echo "Importing availabilities to production..."
psql "$PROD_SUPABASE_DB_URL" -f "$DUMP_FILE"

echo "Cleaning up..."
rm -f "$DUMP_FILE"

echo "Done! Availabilities synced successfully." 