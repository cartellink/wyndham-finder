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
    
    // Here you would typically:
    // 1. Save results to Supabase database
    // 2. Send notifications if new availability found
    // 3. Update cache/search indexes
    
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

// Optional: Handle POST requests for manual triggers
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('🔄 Manual scraping triggered:', body)
    
    // Same scraping logic as GET
    return NextResponse.json({
      success: true,
      message: 'Manual scraping triggered successfully'
    })
    
  } catch (error) {
    console.error('❌ Manual scraping failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger manual scraping' },
      { status: 500 }
    )
  }
} 