# Wyndham Finder

A Next.js application for searching and monitoring Club Wyndham South Pacific resort availability in real-time.

## Features

- 🔍 **Search Interface** - User-friendly search form matching Wyndham's design
- 📱 **Responsive Design** - Grid and list view options for resort results  
- 🗄️ **Supabase Integration** - Database for storing resort and inventory data
- ⏰ **Automated Scraping** - Vercel cron jobs for regular inventory updates
- 🎯 **Real-time Availability** - Track room availability across all South Pacific resorts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Deployment**: Vercel (with cron jobs)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Home page with search form
│   ├── results/                 # Search results page
│   └── api/cron/               # Vercel cron job endpoints
├── components/
│   ├── SearchForm.tsx          # Main search interface
│   ├── SearchFilters.tsx       # Sidebar filters
│   └── ResortCard.tsx          # Resort display component
├── lib/
│   ├── supabase.ts             # Supabase client & types
│   └── scraper/                # Scraping utilities
└── supabase/                   # Database migrations & config
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd wyndham-finder
npm install
```

### 2. Set Up Supabase

```bash
# Start local Supabase (requires Docker)
npm run supabase:start

# Check status
npm run supabase:status
```

### 3. Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Cron Job Security  
CRON_SECRET=your_secure_cron_secret_here

# Wyndham API (for your existing scraping script)
WYNDHAM_API_BASE_URL=https://api.wyndham.com
WYNDHAM_AUTH_TOKEN=your_wyndham_token_here
```

### 4. Database Schema

The app expects these main tables in Supabase:

- `resorts` - Resort information (name, location, amenities, etc.)
- `room_inventory` - Available rooms with dates, credits, status
- `scraping_logs` - Tracking scraping job results

### 5. Import Your Existing Scraping Script

Replace the placeholder in `src/lib/scraper/wyndham-scraper.ts` with your existing API scraping logic.

### 6. Development

```bash
# Start development server
npm run dev

# Test scraping endpoint
npm run scrape:test
```

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Cron Job Configuration

The `vercel.json` configures automatic scraping every 6 hours:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-inventory", 
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## API Endpoints

- `GET /api/cron/scrape-inventory` - Triggered by Vercel cron
- `POST /api/cron/scrape-inventory` - Manual scraping trigger

## Next Steps

1. **Import Existing Script**: Replace the scraper placeholder with your existing Wyndham API code
2. **Database Schema**: Run your existing schema migration in Supabase
3. **Authentication**: Add user authentication if needed
4. **Notifications**: Implement alerts for new availability
5. **Caching**: Add Redis/caching layer for better performance

## UI Components Completed

✅ **Search Form** - Matches Wyndham's interface design  
✅ **Results Page** - Grid/list toggle, resort cards  
✅ **Filters Sidebar** - Location, dates, credits, room type  
✅ **Resort Cards** - Both grid and list view formats

## Development Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production  
npm run supabase:start   # Start local Supabase
npm run supabase:reset   # Reset local database
npm run scrape:test      # Test scraping endpoint
```

Ready for you to import your existing scraping script! 🚀
