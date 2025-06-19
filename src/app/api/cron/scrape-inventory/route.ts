import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('🕒 Starting Wyndham inventory scraping job...')
    
    // Import and run the actual scraping function
    const { scrapeWyndhamInventory } = await import('@/lib/scraper/wyndham-scraper')
    const scrapeResult = await scrapeWyndhamInventory()
    
    console.log('✅ Scraping completed:', scrapeResult)
    
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
    
    // Import and run the scraping function (now with built-in monitoring)
    const { scrapeWyndhamInventory } = await import('@/lib/scraper/wyndham-scraper')
    const scrapeResult = await scrapeWyndhamInventory()
    
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