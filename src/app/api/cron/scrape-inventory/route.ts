import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('🕒 Starting Wyndham inventory scraping job...')
    
    // Import and run the individual scraping functions
    const { syncResorts, syncRooms, syncAvailabilities } = await import('@/lib/scraper/wyndham-scraper')
    
    const results = {
      resorts: null as unknown,
      rooms: null as unknown,
      availabilities: null as unknown,
      executed_at: new Date().toISOString()
    }
    
    // Run all scraping functions sequentially
    try {
      console.log('🏨 Running resort sync...')
      results.resorts = await syncResorts()
      console.log('✅ Resort sync completed')
    } catch (error) {
      console.error('❌ Resort sync failed:', error)
      results.resorts = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    try {
      console.log('🏠 Running rooms sync...')
      results.rooms = await syncRooms()
      console.log('✅ Rooms sync completed')
    } catch (error) {
      console.error('❌ Rooms sync failed:', error)
      results.rooms = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    try {
      console.log('📅 Running availabilities sync...')
      results.availabilities = await syncAvailabilities()
      console.log('✅ Availabilities sync completed')
    } catch (error) {
      console.error('❌ Availabilities sync failed:', error)
      results.availabilities = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    const scrapeResult = results
    console.log('✅ All scraping completed:', scrapeResult)
    
    return NextResponse.json({
      success: true,
      message: 'Inventory scraping completed successfully',
      data: scrapeResult
    })
    
  } catch (error) {
    console.error('❌ Scraping job failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Scraping job failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle POST requests for manual triggers (from the dashboard)
export async function POST() {
  try {
    console.log('🔄 Manual scraping triggered from dashboard')
    
    // Import and run the individual scraping functions
    const { syncResorts, syncRooms, syncAvailabilities } = await import('@/lib/scraper/wyndham-scraper')
    
    const results = {
      resorts: null as unknown,
      rooms: null as unknown,
      availabilities: null as unknown,
      executed_at: new Date().toISOString()
    }
    
    // Run all scraping functions sequentially
    try {
      console.log('🏨 Running resort sync...')
      results.resorts = await syncResorts()
      console.log('✅ Resort sync completed')
    } catch (error) {
      console.error('❌ Resort sync failed:', error)
      results.resorts = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    try {
      console.log('🏠 Running rooms sync...')
      results.rooms = await syncRooms()
      console.log('✅ Rooms sync completed')
    } catch (error) {
      console.error('❌ Rooms sync failed:', error)
      results.rooms = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    try {
      console.log('📅 Running availabilities sync...')
      results.availabilities = await syncAvailabilities()
      console.log('✅ Availabilities sync completed')
    } catch (error) {
      console.error('❌ Availabilities sync failed:', error)
      results.availabilities = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    const scrapeResult = results
    console.log('✅ Manual scraping completed:', scrapeResult)
    
    return NextResponse.json({
      success: true,
      message: 'Manual scraping completed successfully',
      data: scrapeResult
    })
    
  } catch (error) {
    console.error('❌ Manual scraping failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Manual scraping failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 