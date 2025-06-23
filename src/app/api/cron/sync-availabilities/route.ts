import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('📅 Starting availabilities sync cron job...')
    
    // Import the scraper functions dynamically to avoid import issues
    const { syncAvailabilities } = await import('@/lib/scraper/wyndham-scraper')
    const result = await syncAvailabilities()
    
    console.log('✅ Availabilities sync completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Availabilities sync completed successfully',
      data: result.data
    })
    
  } catch (error) {
    console.error('❌ Availabilities sync failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Availabilities sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Manual trigger
export async function POST(request: Request) {
  try {
    // Try to parse JSON body, but don't fail if there isn't one
    let body = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      // No body or invalid JSON, use empty object
    }
    
    console.log('🔄 Manual availabilities sync triggered:', body)
    
    const { syncAvailabilities } = await import('@/lib/scraper/wyndham-scraper')
    const result = await syncAvailabilities()
    
    return NextResponse.json({
      success: true,
      message: 'Manual availabilities sync completed successfully',
      data: result.data
    })
    
  } catch (error) {
    console.error('❌ Manual availabilities sync failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger manual availabilities sync' },
      { status: 500 }
    )
  }
} 