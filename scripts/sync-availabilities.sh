#!/bin/bash

# Wyndham Finder - Sync Availabilities to Production
# This script exports availabilities from local Supabase and imports to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEMP_FILE="temp_availabilities.sql"
LOCAL_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

check_requirements() {
    log $BLUE "🔍 Checking requirements..."
    
    # Check if required commands exist
    command -v supabase >/dev/null 2>&1 || { 
        log $RED "❌ supabase CLI is required but not installed"
        exit 1
    }
    
    command -v pg_dump >/dev/null 2>&1 || { 
        log $RED "❌ pg_dump is required but not installed"
        exit 1
    }
    
    command -v psql >/dev/null 2>&1 || { 
        log $RED "❌ psql is required but not installed"
        exit 1
    }

    # Check if production DB URL is set
    if [ -z "$PROD_SUPABASE_DB_URL" ]; then
        log $RED "❌ PROD_SUPABASE_DB_URL environment variable is required"
        log $YELLOW "Please set it to your production database URL:"
        log $BLUE "export PROD_SUPABASE_DB_URL=\"postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres\""
        exit 1
    fi
    
    log $GREEN "✅ All requirements satisfied"
}

check_local_supabase() {
    log $BLUE "🔍 Checking local Supabase status..."
    
    if ! supabase status >/dev/null 2>&1; then
        log $RED "❌ Local Supabase is not running"
        log $YELLOW "Please start it with: supabase start"
        exit 1
    fi
    
    log $GREEN "✅ Local Supabase is running"
}

export_availabilities() {
    log $BLUE "📦 Exporting availabilities from local database..."
    
    # Remove temp file if it exists
    rm -f "$TEMP_FILE"
    
    # Export data using pg_dump
    if pg_dump "$LOCAL_DB_URL" \
        --table=availabilities \
        --data-only \
        --inserts \
        --no-owner \
        --no-privileges \
        --file="$TEMP_FILE"; then
        
        if [ -f "$TEMP_FILE" ] && [ -s "$TEMP_FILE" ]; then
            local file_size=$(du -h "$TEMP_FILE" | cut -f1)
            log $GREEN "✅ Successfully exported availabilities ($file_size)"
            return 0
        else
            log $YELLOW "⚠️  Warning: Export file is empty - no availabilities data found in local database"
            return 1
        fi
    else
        log $RED "❌ Failed to export availabilities"
        exit 1
    fi
}

truncate_and_import() {
    log $YELLOW "🗑️  Truncating availabilities table in production..."
    
    # Truncate the production table
    if psql "$PROD_SUPABASE_DB_URL" -c "TRUNCATE TABLE availabilities RESTART IDENTITY CASCADE;"; then
        log $GREEN "✅ Successfully truncated availabilities table"
    else
        log $RED "❌ Failed to truncate availabilities table"
        exit 1
    fi
    
    # Check if we have data to import
    if [ ! -f "$TEMP_FILE" ] || [ ! -s "$TEMP_FILE" ]; then
        log $YELLOW "⚠️  No data to import - availabilities table is now empty in production"
        return 0
    fi
    
    log $BLUE "📥 Importing availabilities to production..."
    
    # Import the data
    if psql "$PROD_SUPABASE_DB_URL" -f "$TEMP_FILE"; then
        log $GREEN "✅ Successfully imported availabilities to production"
        
        # Get row count
        local count=$(psql "$PROD_SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM availabilities;" | tr -d ' ')
        log $BLUE "📊 Total availabilities in production: $count"
    else
        log $RED "❌ Failed to import availabilities to production"
        exit 1
    fi
}

cleanup() {
    if [ -f "$TEMP_FILE" ]; then
        rm -f "$TEMP_FILE"
        log $BLUE "🧹 Cleaned up temporary files"
    fi
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

main() {
    log $BLUE "🚀 Starting availabilities sync to production..."
    
    # Pre-flight checks
    check_requirements
    check_local_supabase
    
    # Export from local
    if export_availabilities; then
        has_data=true
    else
        has_data=false
    fi
    
    # Confirm before proceeding
    if [ "$has_data" = true ]; then
        log $YELLOW "⚠️  This will TRUNCATE all availabilities in production and replace with local data!"
        log $YELLOW "Press Ctrl+C within 5 seconds to cancel..."
        sleep 5
    fi
    
    # Import to production
    truncate_and_import
    
    log $GREEN "🎉 Availabilities sync completed successfully!"
}

# Handle interrupt signals
trap 'log $YELLOW "\n❌ Operation cancelled by user"; exit 0' INT TERM

# Run the main function
main 